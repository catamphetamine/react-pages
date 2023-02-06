// import { isEqual } from 'lodash-es'
import isEqual from 'lodash/isEqual.js'

import {
	redirect,
	goto,
	REDIRECT_ACTION_TYPE,
	GOTO_ACTION_TYPE,
	RedirectException
} from '../../router/index.js'

import getRoutePath from '../../router/getRoutePath.js'

import { isInstantTransition } from '../client/instantNavigation.js'

import generatePreloadChain from './chain.js'

import { PRELOAD_FAILED } from './actions.js'

import collectTranslations from '../translate/collect.js'

export const PRELOAD_METHOD_NAME = 'load'

export default function _preload(
	location,
	previousLocation,
	routerArgs,
	codeSplit,
	server,
	getCookie,
	getLocale,
	dispatch,
	getState
) {
	// If it's a "Back"/"Forward" navigation
	const isBackOrForwardNavigation =
		location.action === 'POP' &&
		location.delta !== 0 &&
		// During server-side rendering, `action` is "POP" and `delta` is `0`.
		!server

	// If it's an instant "Back"/"Forward" navigation
	// then navigate to the page without loading it.
	// (has been previously preloaded and is in Redux state)
	const _isInstantTransition = isBackOrForwardNavigation &&
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
	// `dispatch` for client side cancels current `load` on redirect.
	dispatch = instrumentDispatch(dispatch, server, preloading)

	const history = getHistory({ server })
		.concat(createHistoryEntry({ routes, location }))

	// Preload all the required data for this route (page)
	let preload
	if (!_isInstantTransition) {
		let _routes = routes
		let _components = components

		// Client-side optimization.
		// Skips `load`s for routes that didn't change as a result of navigation.
		if (!server) {
			if (codeSplit) {
				_routes = filterByChangedRoutes(_routes, routeIndices, routeParams)
			} else {
				_components = filterByChangedRoutes(_components, routeIndices, routeParams)
			}
			window._ReactPages_PreviousRoutes = routeIndices
			window._ReactPages_PreviousRoutes_parameters = routeParams
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
			history,
			getCookie,
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
		(result) => {
			preloading.pending = false
			// If this navigation process was cancelled
			// before `load` finished its work,
			// then don't take any further steps on this cancelled navigation.
			if (preloading.cancelled) {
				// Return `false` out of the `Promise`
				// indicating that the navigation was cancelled.
				return false
			}
			setHistory(history, { server })
			return result
		},
		(error) => {
			// If this navigation process was cancelled
			// before `load` finished its work,
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
// `dispatch` for client side cancels current `load` on redirect.
function instrumentDispatch(dispatch, server, preloading) {
	return (event) => {
		switch (event.type) {
			// In case of navigation from `load`.
			case REDIRECT_ACTION_TYPE:
			case GOTO_ACTION_TYPE:
				// Discard the currently ongoing preloading.
				// (if some kind of a `bluebird` is used)
				if (preloading.cancel) {
					preloading.cancel()
				}
				// if (!server && window._ReactPages_Page_SkipDataLoad_on_navigation) {
				// 	console.warn('Looks like you\'re calling `dispatch(pushLocation())` or `dispatch(replaceLocation())` inside `load`. Call them in `onLoaded()` instead.')
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
// @parameter components - matched routes' components.
//
// @returns an array of `component_preloaders`.
// `component_preloaders` is an array of all
// `load`s for a particular React component:
// objects having shape `{ preload(), options }`.
// Therefore the returned value is an array of arrays.
//
export function collectPreloadersFromComponents(components)
{
	// Find all static `preload` methods on the route component chain
	return components
		// Some wrapper routes can have no `component`.
		// Select all components having `load`s.
		.filter(component => component && component[PRELOAD_METHOD_NAME])
		// Extract `load` functions and their options.
		.map(component => normalizeLoad(component[PRELOAD_METHOD_NAME]).map(({ load, ...rest }) => ({
			preload: load,
			options: rest
		})))
		// // Flatten `load` functions and their options.
		// .reduce((all, preload_and_options) => all.concat(preload_and_options), [])
}

function collectPreloadersFromRoutes(routes) {
	// Find all preload properties on the route chain.
	return routes
		.map(_ => _.load)
		.filter(_ => _)
		.map((load) => {
			return normalizeLoad(load).map(({ load, ...rest }) => ({
				preload: load,
				options: rest
			}))
		})
		// Flatten the array.
		// .reduce((all, preload_and_options) => all.concat(preload_and_options), [])
}

// A minor optimization for skipping `load`s
// for those parent routes which haven't changed
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
// Therefore `load`s could be skipped
// for those top level components which remain
// the same (and in the same state).
// This would be an optimization.
//
// (e.g. the main route could be `load`ed only once - on the server side)
//
// At the same time, at least one component should be preloaded:
// even if navigating to the same page it still kinda makes sense to reload it.
// (assuming it's not an "anchor" hyperlink navigation)
//
// Also, GET query parameters would also need to be compared, I guess.
// But, I guess, it would make sense to assume that GET parameters
// only affect the last routes component in the chain.
// And, in general, GET query parameters should be avoided,
// but that's not the case for example with search forms.
// So here we assume that GET query parameters only
// influence the last route component in the chain
// which is gonna be reloaded anyway.
//
function filterByChangedRoutes(filtered, routes, routeParams)
{
	let filteredByChangedRoutes = filtered

	if (window._ReactPages_PreviousRoutes)
	{
		const previous_routes = window._ReactPages_PreviousRoutes
		const previous_routes_parameters = window._ReactPages_PreviousRoutes_parameters

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

function normalizeLoad(load) {
	if (typeof load === 'function') {
		load = { load }
	}
	if (!Array.isArray(load)) {
		load = [load]
	}
	return load
}

function getHistory({ server }) {
	if (server) {
		return []
	}
	return window._ReactPages_Navigation_History || []
}

function setHistory(history, { server }) {
	if (server) {
		return
	}
	window._ReactPages_Navigation_History = history
}

function createHistoryEntry({ routes, location }) {
	return {
		// A complete `path` for matched route chain.
		// E.g. "/user/:userId/post/:postId"
		// for matched URL "/user/1/post/123?key=value".
		route: getRoutePath(routes),
		action: getHistoryAction(location)
	}
}

function getHistoryAction(location) {
	if (location.index === 0) {
		return 'start'
	} else if (location.action === 'POP') {
		return location.delta === -1 ? 'back' : 'forward'
	} else if (location.action === 'PUSH') {
		return 'push'
	} else if (location.action === 'REPLACE') {
		return 'redirect'
	} else {
		console.error('[react-pages] Couldn\'t get a history entry action for location')
		console.log(location)
	}
}