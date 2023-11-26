import React from 'react'

import { RedirectException } from '../router/index.js'
// import getRoutePath from '../router/getRoutePath.js'
import forEachRoute from '../router/forEachRoute.js'
import forEachLeafRoute from '../router/forEachLeafRoute.js'

import MetaUpdater from './meta/MetaUpdater.js'

export default function createRenderFunctionsForRoutes(routes, {
	stash,
	codeSplit,
	server
}) {
	const getMetaFunction = (route) => codeSplit ? route.meta : route.Component.meta
	const getShouldPassMetaComponentProperty = (route) => codeSplit ? route.metaComponentProperty : route.Component.metaComponentProperty

	const createRenderFunctionForRoute = (route, { routePosition }) => {
		const meta = getMetaFunction(route)
		const shouldPassMetaComponentProperty = getShouldPassMetaComponentProperty(route)

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

			const renderComponent = () => React.createElement(Component, componentProps)

			const renderMetaUpdaterComponent = (customProps) => {
				return React.createElement(MetaUpdater, {
					meta,
					stash,
					routePosition,
					props: data && data.props,
					customProps
				})
			}

			const shouldUpdateMetaInRealTime = !server && meta

			if (shouldPassMetaComponentProperty) {
				if (shouldUpdateMetaInRealTime) {
					componentProps.Meta = renderMetaUpdaterComponent
				} else {
					componentProps.Meta = EmptyComponent
				}
			}

			if (shouldUpdateMetaInRealTime) {
				return React.createElement(
					MetaUpdaterAndPageComponent,
					{
						// Passing `componentElement` as `children` here didn't work
						// because `found` router overrides the `children` of the returned React Element.
						componentElement: renderComponent(),
						metaUpdaterElement: renderMetaUpdaterComponent()
					}
				)
			}

			return renderComponent()
		}
	}

	// Set `render` function on the "root" route `Component`.
	routes[0].render = createRenderFunctionForRoute(routes[0], { routePosition: 'root' })

	// Set `render` function on the "leaf" route `Component`s.
	forEachLeafRoute(routes, (leafRoute) => {
		leafRoute.render = createRenderFunctionForRoute(leafRoute, { routePosition: 'leaf' })
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

function EmptyComponent() {
	return null
}

function MetaUpdaterAndPageComponent({
	metaUpdaterElement,
	componentElement,
	// `children` are passed by `found` router to the root route's component.
	// `children` may be `undefined` until `found` router has finished rendering the route.
	children
}) {
	// https://stackoverflow.com/questions/27290013/how-to-render-multiple-children-without-jsx
	return React.createElement(React.Fragment, null,
		metaUpdaterElement,
		React.cloneElement(componentElement, null, children)
	)
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