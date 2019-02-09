import isEqual from 'lodash/isEqual'

import {
	redirect,
	goto,
	REDIRECT_ACTION_TYPE,
	GOTO_ACTION_TYPE,
	RedirectException
} from '../../router'

import { isInstantTransition } from '../client/instantBack'

import generatePreloadChain from './chain'

import { PRELOAD_FAILED } from './actions'

import collectTranslations from '../translate/collect'

import { PRELOAD_METHOD_NAME, PRELOAD_OPTIONS_NAME } from './decorator'

export default function _preload(
	location,
	previousLocation,
	routerArgs,
	codeSplit,
	server,
	getLocale,
	dispatch,
	getState
) {
	// If it's an instant "Back"/"Forward" navigation
	// then navigate to the page without preloading it.
	// (has been previously preloaded and is in Redux state)
	const _isInstantTransition = !server &&
		location.action === 'POP' &&
		previousLocation &&
		isInstantTransition(previousLocation, location)

	// Preload status object.
	// `preloading` holds the cancellation flag for this navigation process.
	// (e.g. preloading `Promise` chain could be cancelled in case of a redirect)
	const preloading = {}

	// Can cancel previous preloading (on the client side)
	let previousPreloading
	if (!server) {
		previousPreloading = window.__preloading_page
		window.__preloading_page = preloading
	}

	if (!server) {
		// If on the client side, then store the current pending navigation,
		// so that it can be cancelled when a new navigation process takes place
		// before the current navigation process finishes.
		//
		// If there's preceeding navigation pending,
		// then cancel that previous navigation.
		if (previousPreloading && previousPreloading.pending && !previousPreloading.cancelled) {
			previousPreloading.cancel()
		}
	}

	const { routes, routeParams, routeIndices, params } = routerArgs
	const components = routes.map(_ => _.Component)

	// Instrument `dispatch`.
	// `dispatch` for server side `throw`s a special "redirect error" on redirect.
	// `dispatch` for client side cancels current `@preload()` on redirect.
	dispatch = instrumentDispatch(dispatch, server, preloading)

	// Preload all the required data for this route (page)
	let preload
	if (!_isInstantTransition) {
		let _routes = routes
		let _components = components

		// Client-side optimization.
		// Skips `@preloads()` for `<Route/>`s that didn't change as a result of navigation.
		if (!server) {
			if (codeSplit) {
				_routes = filterByChangedRoutes(_routes, routeIndices, routeParams)
			} else {
				_components = filterByChangedRoutes(_components, routeIndices, routeParams)
			}
			window._react_website_previous_routes = routeIndices
			window._react_website_previous_routes_parameters = routeParams
		}

		// Get all `preload` methods on the React-Router component chain
		const preloaders = codeSplit ? collectPreloadersFromRoutes(_routes) : collectPreloadersFromComponents(_components)

		const isInitialClientSidePreload = !server && !previousLocation

		preload = generatePreloadChain(
			preloaders,
			server,
			isInitialClientSidePreload,
			getState,
			dispatch,
			location,
			params,
			preloading
		)
	}

	// Load translations (if any).
	let loadTranslation
	if (getLocale) {
		loadTranslation = collectTranslations(
			components,
			routes,
			routeIndices,
			codeSplit,
			getLocale(getState()),
			dispatch
		)
	}

	// Combine promises.
	let promise
	if (preload) {
		if (loadTranslation) {
			promise = Promise.all([preload(), loadTranslation()])
		} else {
			promise = preload()
		}
	} else if (loadTranslation) {
		promise = loadTranslation()
	}

	// If nothing to preload, just move to the next middleware
	if (!promise) {
		return Promise.resolve()
	}

	preloading.pending = true

	// Preloading process cancellation
	preloading.cancel = () => {
		preloading.cancelled = true
		// If `bluebird` is used,
		// and promise cancellation has been set up,
		// then cancel the `Promise`.
		// http://bluebirdjs.com/docs/api/cancellation.html
		if (promise.cancel) {
			// `.catch()` is to suppress "Uncaught promise rejection" errors
			promise.catch(() => ({})).cancel()
		}
	}

	return promise.then(
		// Navigate to the new page
		() => {
			preloading.pending = false
			// If this navigation process was cancelled
			// before @preload() finished its work,
			// then don't take any further steps on this cancelled navigation.
			if (preloading.cancelled) {
				// Return `false` out of the `Promise`
				// indicating that the navigation was cancelled.
				return false
			}
		},
		(error) => {
			// If this navigation process was cancelled
			// before @preload() finished its work,
			// then don't take any further steps on this cancelled navigation.
			if (!preloading.cancelled) {
				if (!server) {
					preloading.error = error
				}
				// Page loading indicator could listen for this event
				dispatch({ type: PRELOAD_FAILED, error })
			}
			// Update preload status object
			preloading.pending = false
			// May be a server-side special "redirect" error.
			throw error
		}
	)
}

// Instrument `dispatch`.
// `dispatch` for server side `throw`s a special "redirect error" on redirect.
// `dispatch` for client side cancels current `@preload()` on redirect.
function instrumentDispatch(dispatch, server, preloading) {
	return (event) => {
		switch (event.type) {
			// In case of navigation from @preload().
			case REDIRECT_ACTION_TYPE:
			case GOTO_ACTION_TYPE:
				// Discard the currently ongoing preloading.
				// (if some kind of a `bluebird` is used)
				if (preloading.cancel) {
					preloading.cancel()
				}
				// if (!server && window._react_website_skip_preload_update_location) {
				// 	console.warn('Looks like you\'re calling `dispatch(pushLocation())` or `dispatch(replaceLocation())` inside `@preload()`. Call them in `@onPageLoaded()` instead.')
				// }
				throw new RedirectException(event.payload)
			default:
				// Proceed normally.
				return dispatch(event)
		}
	}
}

// Finds all `preload` (or `preload_deferred`) methods
// (they will be executed in parallel).
//
// @parameter components - `react-router` matched components
//
// @returns an array of `component_preloaders`.
// `component_preloaders` is an array of all
// `@preload()`s for a particular React component:
// objects having shape `{ preload(), options }`.
// Therefore the returned value is an array of arrays.
//
export function collectPreloadersFromComponents(components)
{
	// Find all static `preload` methods on the route component chain
	return components
		// Some wrapper `<Route/>`s can have no `component`.
		// Select all components having `@preload()`.
		.filter(component => component && component[PRELOAD_METHOD_NAME])
		// Extract `@preload()` functions and their options.
		.map((component) => component[PRELOAD_METHOD_NAME].map((preload, i) => ({
			preload,
			options: component[PRELOAD_OPTIONS_NAME][i]
		})))
		// // Flatten `@preload()` functions and their options.
		// .reduce((all, preload_and_options) => all.concat(preload_and_options), [])
}

function collectPreloadersFromRoutes(routes) {
	// Find all preload properties on the route chain.
	return routes
		.map((route) => {
			const preloads = []
			if (route.preload) {
				const preload = route.preload
				preloads.push({
					preload,
					options: preload.options || {}
				})
			}
			if (route.preloadClient) {
				const preload = route.preloadClient
				preloads.push({
					preload,
					options: {
						...preload.options,
						client: true
					}
				})
			}
			if (route.preloadClientAfter) {
				const preload = route.preloadClientAfter
				preloads.push({
					preload,
					options: {
						...preload.options,
						client: true,
						blockingSibling: true
					}
				})
			}
			return preloads
		})
		.filter(_ => _.length > 0)
		// Flatten the array.
		// .reduce((all, preload_and_options) => all.concat(preload_and_options), [])
}

// A minor optimization for skipping `@preload()`s
// for those parent `<Route/>`s which haven't changed
// as a result of a client-side navigation.
//
// On client side:
//
// Take the previous route components
// (along with their parameters)
// and the next route components
// (along with their parameters),
// and compare them side-by-side
// filtering out the same top level components
// (both having the same component classes
//  and having the same parameters).
//
// Therefore @preload() methods could be skipped
// for those top level components which remain
// the same (and in the same state).
// This would be an optimization.
//
// (e.g. the main <Route/> could be @preload()ed only once - on the server side)
//
// At the same time, at least one component should be preloaded:
// even if navigating to the same page it still kinda makes sense to reload it.
// (assuming it's not an "anchor" hyperlink navigation)
//
// Parameters for each `<Route/>` component can be found using this helper method:
// https://github.com/ReactTraining/react-router/blob/master/modules/getRouteParams.js
//
// Also, GET query parameters would also need to be compared, I guess.
// But, I guess, it would make sense to assume that GET parameters
// only affect the last `<Route/>` component in the chain.
// And, in general, GET query parameters should be avoided,
// but that's not the case for example with search forms.
// So here we assume that GET query parameters only
// influence the last `<Route/>` component in the chain
// which is gonna be reloaded anyway.
//
function filterByChangedRoutes(filtered, routes, routeParams)
{
	let filteredByChangedRoutes = filtered

	if (window._react_website_previous_routes)
	{
		const previous_routes = window._react_website_previous_routes
		const previous_routes_parameters = window._react_website_previous_routes_parameters

		let i = 0
		while (i < routes.length - 1 &&
			previous_routes[i] === routes[i] &&
			isEqual(previous_routes_parameters[i], routeParams[i]))
		{
			i++
		}

		filteredByChangedRoutes = filteredByChangedRoutes.slice(i)
	}

	return filteredByChangedRoutes
}
