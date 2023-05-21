import React from 'react'

// import { isEqual } from 'lodash-es'
import isEqual from 'lodash/isEqual.js'

import { useSelector } from 'react-redux'

import { RedirectException } from '../router/index.js'
import getRoutePath from '../router/getRoutePath.js'
import forEachRoute from '../router/forEachRoute.js'
import forEachLeafRoute from '../router/forEachLeafRoute.js'
import validateRoutes from '../router/validateRoutes.js'

import mergeMeta from '../meta/mergeMeta.js'
import applyMeta from '../meta/applyMeta.js'
import dropUndefinedProperties from '../meta/dropUndefinedProperties.js'

import getData from './load/getData.js'

export default function processRoutes(routes, {
	stash,
	codeSplit,
	server,
	onError,
	getLocale,
	getCookie
}) {
	validateRoutes(routes)

	const getLoadFunction = (route) => codeSplit ? route.load : route.Component.load
	const getMetaFunction = (route) => codeSplit ? route.meta : route.Component.meta

	const getRenderFunctionForRoute = (route, { routePosition }) => {
		const meta = getMetaFunction(route)

		// Naming `componentElement` property as `children` here didn't work
		// because `found` router overrides the `children` of the returned React Element.
		function MetaUpdater({ props, componentElement, children }) {
			// `meta()` function uses `useSelector()` hook,

			// Calculate `newMeta` even if `window._ReactPages_InitialMetaHasBeenApplied` is `false`,
			// so that it calls the `useSelector()` hook which will trigger a rerender later
			// when the value returned by that `useSelector()` hook changes.
			const newMeta = dropUndefinedProperties(
				meta({
					useSelector: getter => useSelector(getter),
					props: props || {}
				})
			)

			if (window._ReactPages_InitialMetaHasBeenApplied) {
				let prevMeta
				switch (routePosition) {
					case 'root':
						prevMeta = stash.getRootComponentMeta()
						break
					case 'leaf':
						prevMeta = stash.getPageComponentMeta()
						break
					default:
						throw new Error(`[react-pages] Unsupported route position: "${routePosition}"`)
				}

				if (!isEqual(prevMeta, newMeta)) {
					switch (routePosition) {
						case 'root':
							applyMeta(mergeMeta({
								rootMetaData: newMeta,
								pageMetaData: stash.getPageComponentMeta(),
								stash
							}))
							console.log('[react-pages] Root <meta/> updated')
							break
						case 'leaf':
							applyMeta(mergeMeta({
								rootMetaData: stash.getRootComponentMeta(),
								pageMetaData: newMeta,
								stash
							}))
							console.log('[react-pages] Page <meta/> updated')
							break
						default:
							throw new Error(`[react-pages] Unsupported route position: "${routePosition}"`)
					}
				}
			}

			// `children` are passed by `found` router to the root route's component.
			if (children) {
				return React.cloneElement(componentElement, null, children)
			}

			return componentElement
		}

		return ({ Component, props, ...rest }) => {
			// * `Component` — The component for the route, if any. `null` if the component has not yet been loaded.
			// * `props` — The default props for the route component, specifically `match` with `data` as an additional property. `null` if `data` have not yet been loaded.
			// * `match` — (not used) `found`'s `Match` object. Includes: `routes`, `context` (contains `dispatch` and `getState()`), etc. https://github.com/4Catalyzer/found/blob/master/src/typeUtils.ts

			if (!Component || !props) {
				// `undefined` indicates that either the `Component` is not loaded yet
				// or the `data` for the route hasn't been loaded yet.
				return undefined
			}

			// https://4catalyzer.github.io/found/docs/configuration/route-config
			const {
				// match,
				router,
				data
			} = props

			// const { params } = match

			let componentProps = {}

			if (data) {
				if (data.redirect) {
					// 307 Temporary Redirect
					// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307
					// 308 Permanent Redirect
					// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308
					// const redirectStatusCode = data.redirect.statusCode
					const redirectStatusCode = undefined // is gonna be `302` by default in `found` router.
					throw new RedirectException(data.redirect.url, redirectStatusCode)
				}
				if (data.props) {
					componentProps = {
						...data.props,
						...componentProps
					}
				}
			}

			const componentElement = React.createElement(Component, componentProps)

			if (!server && meta) {
				return React.createElement(
					MetaUpdater,
					{
						props: data && data.props,
						componentElement
					}
					// Passing `componentElement` as `children` here didn't work
					// because `found` router overrides the `children` of the returned React Element.
				)
			}

			return componentElement
		}
	}

	// Set `getData` function on the root route's `Component`.
	// https://4catalyzer.github.io/found/docs/configuration/route-config#data-or-getdata
	if (getLoadFunction(routes[0])) {
		routes[0].getData = createGetDataFunction({
			routePosition: 'root',
			routes,
			codeSplit,
			server,
			onError,
			getLocale,
			getCookie,
			stash
		})
	}

	routes[0].render = getRenderFunctionForRoute(routes[0], { routePosition: 'root' })

	// Set `getData` function on the "leaf" route `Component`s.
	// https://4catalyzer.github.io/found/docs/configuration/route-config#data-or-getdata

	forEachLeafRoute(routes, (leafRoute) => {
		if (getLoadFunction(leafRoute)) {
			leafRoute.getData = createGetDataFunction({
				routePosition: 'leaf',
				routes,
				codeSplit,
				server,
				onError,
				getLocale,
				getCookie,
				stash
			})

			// `defer: true` instructs `getData` of this route and all of its descendants
			// to wait for all parent route `getData` promises.
			//
			// "Setting defer on a route will make the resolver defer calling its
			//  getData method and the getData methods on all of its descendants until
			//  all of its parent data promises have resolved."
			//
			// https://4catalyzer.github.io/found/docs/configuration/route-config
			leafRoute.defer = true
		}

		leafRoute.render = getRenderFunctionForRoute(leafRoute, { routePosition: 'leaf' })
	})

	// Set up redirects on routes.
	// https://4catalyzer.github.io/found/docs/advanced/redirects/
	forEachRoute(routes, (route) => {
		if (route.permanentRedirectTo) {
			route.render = () => {
				// 307 Temporary Redirect
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307
				// 308 Permanent Redirect
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308
				// 301 Moved Permanently (permanent redirect)
				// 302 Found (temporary redirect)
				// https://stackoverflow.com/questions/4764297/difference-between-http-redirect-codes
				// const redirectStatusCode = route.temporaryRedirectTo ? 302 : 301
				const redirectStatusCode = 301
		    throw new RedirectException(
		    	route.permanentRedirectTo,
		    	redirectStatusCode
		    )
		  }
		}
	})

	// // Collect `errorPages` map from routes' `default: true` properties.
	// const defaultErrorPages = {}
	// forEachRoute(routes, (route) => {
	// 	if (route.default) {
	// 		if (route.status) {
	// 			if (defaultErrorPages[route.status]) {
	// 				throw new Error(`[react-pages] There already is a \`default: true\` route for \`status: ${route.status}\`: "${getRoutePath(parentRoutes.concat(route))}"`)
	// 			}
	// 			if (route.path.indexOf(':') >= 0) {
	// 				throw new Error(`[react-pages] A \`default: true\` route's \`path\` can't contain a colon (":")`)
	// 			}
	// 			defaultErrorPages[route.status] = route.path
	// 		}
	// 	}
	// })
}

function createGetDataFunction(parameters) {
	// The `context` parameter is the `matchContext` parameter that's passed in `./lib/router/index.js`.
	// https://4catalyzer.github.io/found/docs/configuration/route-config#data-or-getdata
	return function({ params, context: { dispatch, getState } }) {
		return getData({
			...parameters,
			params,
			dispatch,
			getState
		})
	}
}

// function isEqualMeta(a, b) {
// 	if (!a && !b) {
// 		return true
// 	}
// 	if (a && !b || !a && b) {
// 		return false
// 	}
// 	const aKeys = Object.keys(a)
// 	const bKeys = Object.keys(b)
// 	if (aKeys.length !== bKeys.length) {
// 		return false
// 	}
// 	for (const key of aKeys) {
// 		if (Array.isArray(a[key])) {
// 			check that b[key] is an array
// 			compare array lengths
// 			compare array elements
// 		} else if (isObject(a[key])) {
// 			check that b[key] is an object
// 			compare objects
// 		} else {
// 			if (a[key] !== b[key]) {
// 				return false
// 			}
// 		}
// 	}
// 	return true
// }