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

import createCombinedLoadFunction from './combine.js'

import { LOAD_FAILED } from './actions.js'

export const LOAD_METHOD_NAME = 'load'

export default function load_({
	location,
	previousLocation,
	routePosition,
	routerArgs,
	codeSplit,
	server,
	getCookie,
	getLocale,
	dispatch,
	useSelector
}) {
	// If it's an instant "Back"/"Forward" navigation
	// then navigate to the page without loading it.
	// (has been previously loaded and is in Redux state)
	const _isInstantTransition = isInstantTransition_({
		location,
		previousLocation,
		server
	})

	// Preload status object.
	// `loading` holds the cancellation flag for this navigation process.
	// (e.g. loading `Promise` chain could be cancelled in case of a redirect)
	const loading = {}

	// Can cancel previous loading (on the client side)
	let previousPreloading
	if (!server) {
		previousPreloading = window.__loading_page
		window.__loading_page = loading
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

	const { routes, params } = routerArgs

	// Instrument `dispatch`.
	// `dispatch` for server side `throw`s a special "redirect error" on redirect.
	// `dispatch` for client side cancels current `load` on redirect.
	dispatch = instrumentDispatch(dispatch, server, loading)

	const history = getHistory({ server })
		.concat(createHistoryEntry({ routes, location }))

	// Preload all the required data for this route (page)
	let combinedLoadFunction
	if (!_isInstantTransition) {
		const { routeParams, routeIndices } = routerArgs

		const loaders = getLoadFunctions({
			routes,
			routePosition,
			routeParams,
			routeIndices,
			codeSplit,
			server
		})

		const isInitialClientSideLoad = !server && !previousLocation

		combinedLoadFunction = createCombinedLoadFunction(
			loaders,
			server,
			isInitialClientSideLoad,
			useSelector,
			dispatch,
			location,
			params,
			history,
			getCookie,
			loading
		)
	}

	let promise
	if (combinedLoadFunction) {
		promise = combinedLoadFunction()
	}

	// If nothing to load, just move to the next middleware
	if (!promise) {
		return Promise.resolve()
	}

	loading.pending = true

	// Preloading process cancellation
	loading.cancel = () => {
		loading.cancelled = true
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
			loading.pending = false
			// If this navigation process was cancelled
			// before `load` finished its work,
			// then don't take any further steps on this cancelled navigation.
			if (loading.cancelled) {
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
			if (!loading.cancelled) {
				if (!server) {
					loading.error = error
				}
				// Page loading indicator could listen for this event
				dispatch({ type: LOAD_FAILED, error })
			}
			// Update load status object
			loading.pending = false
			// May be a server-side special "redirect" error.
			throw error
		}
	)
}

// Instrument `dispatch`.
// `dispatch` for server side `throw`s a special "redirect error" on redirect.
// `dispatch` for client side cancels current `load` on redirect.
function instrumentDispatch(dispatch, server, loading) {
	return (event) => {
		switch (event.type) {
			// In case of navigation from `load`.
			case REDIRECT_ACTION_TYPE:
			case GOTO_ACTION_TYPE:
				// Discard the currently ongoing loading.
				// (if some kind of a `bluebird` is used in place of `Promise`)
				if (loading.cancel) {
					loading.cancel()
				}
				// if (!server && window._ReactPages_Page_SkipDataLoadOnNavigation) {
				// 	console.warn('Looks like you\'re calling `dispatch(pushLocation())` or `dispatch(replaceLocation())` inside `load`. Call them in `onLoaded()` instead.')
				// }
				// 307 Temporary Redirect
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307
				// 308 Permanent Redirect
				// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308
				const redirectStatusCode = undefined
				throw new RedirectException(event.payload, redirectStatusCode)
			default:
				// Proceed normally.
				return dispatch(event)
		}
	}
}

// Finds all `load` methods
// (they will be executed in parallel).
//
// Parameter — components - the `Component`s of the matched routes chain.
//
// Returns an array of `componentLoaders`.
// `componentLoaders` is an array of all
// `load`s for a particular React component:
// objects having shape `{ load(), options }`.
// Therefore the returned value is an array of arrays.
//
export function collectLoadFunctionsFromComponents(components)
{
	// Find all static `load` methods on the route component chain
	return components
		// Some wrapper routes can have no `component`.
		// Select all components having `load`s.
		.filter(component => component && component[LOAD_METHOD_NAME])
		// Extract `load` functions and their options.
		.map(component => normalizeLoadFunction(component[LOAD_METHOD_NAME]).map(({ load, ...rest }) => ({
			load: load,
			options: rest
		})))
		// // Flatten `load` functions and their options.
		// .reduce((all, load_and_options) => all.concat(load_and_options), [])
}

function collectLoadFunctionsFromRoutes(routes) {
	// Find all `.load()` properties on the route chain.
	return routes
		.map(_ => _.load)
		.filter(_ => _)
		.map((load) => {
			return normalizeLoadFunction(load).map(({ load, ...rest }) => ({
				load: load,
				options: rest
			}))
		})
		// Flatten the array.
		// .reduce((all, load_and_options) => all.concat(load_and_options), [])
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
// At the same time, at least one component should be loaded:
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
function ignoreUnchangedRoutes(items, routes, routeParams, previousRoutes, previousRoutesParameters) {
	if (previousRoutes) {
		let i = 0
		while (
			i < routes.length - 1 &&
			previousRoutes[i] === routes[i] &&
			isEqual(previousRoutesParameters[i], routeParams[i])
		) {
			i++
		}

		return items.slice(i)
	}

	return items
}

function normalizeLoadFunction(load) {
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

function isInstantTransition_({ location, previousLocation, server }) {
	// If it's a "Back"/"Forward" navigation
	const isBackOrForwardNavigation =
		location.action === 'POP' &&
		location.delta !== 0 &&
		// During server-side rendering, `action` is "POP" and `delta` is `0`.
		!server

	// If it's an instant "Back"/"Forward" navigation
	// then navigate to the page without loading it.
	// (has been previously loaded and is in Redux state)
	return isBackOrForwardNavigation && isInstantTransition(previousLocation, location)
}

function getLoadFunctions({
	routes,
	routePosition,
	routeParams,
	routeIndices,
	codeSplit,
	server
}) {
	const rootRoute = routes[0]

	// Client-side optimization.
	// Skips `load`s for routes that didn't change as a result of navigation.
	if (!server) {
		const previousRoutes = window._ReactPages_PreviousRoutes
		const previousRoutesParameters = window._ReactPages_PreviousRoutes_parameters

		routes = ignoreUnchangedRoutes(routes, routeIndices, routeParams, previousRoutes, previousRoutesParameters)

		window._ReactPages_PreviousRoutes = routeIndices
		window._ReactPages_PreviousRoutes_parameters = routeParams
	}

	// In older versions of this library, it was possible to assign a `.load()` function
	// to all `Component`s in a route chain for a given URL.
	// Later it was decided that a simpler structure with just the last `Component`
	// in the route chain having a `.load()` function is more convenient.
	// Because of that, there's really no more "chain" but rather just the last `Component`'s
	// `.load()` function and optionally a configurable "pre" `load()` function from `react-pages.js`
	// configuration file that gets executed before the `Component`'s `.load()` function.

	switch (routePosition) {
		case 'root':
			// If the "root" route is still considered for collecting `.load()` functions,
			// then use only its `.load()` function. Otherwise, no `.load()` function.
			routes = routes[0] === rootRoute ? [rootRoute] : []
			break
		case 'leaf':
			routes = [routes[routes.length - 1]]
			break
		default:
			throw new Error(`Unsupported route position: "${routePosition}"`)
	}

	// Get all `load` functions in the route components chain.
	if (codeSplit) {
		return collectLoadFunctionsFromRoutes(routes)
	} else {
		return collectLoadFunctionsFromComponents(routes.map(_ => _.Component))
	}
}