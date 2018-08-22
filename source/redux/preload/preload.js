import { getLocationUrl } from '../../location'
import throwRedirectError from '../../serverRedirect'

import {
	redirect,
	goto,
	REDIRECT_ACTION_TYPE,
	GOTO_ACTION_TYPE,
	getRoutePath,
	// getMatchedRoutes,
	// getMatchedRoutesParams,
	// getRouteParams
} from '../../router'

import {
	isInstantTransition,
	setInstantNavigationFlag,
	addInstantBack,
	resetInstantBack
} from '../client/instantBack'

import timer from '../../timer'
import { getMeta, updateMeta } from '../../meta/meta'
import { ON_PAGE_LOADED_METHOD_NAME } from './onPageLoaded'
import generatePreloadChain from './collect'

import {
	PRELOAD_STARTED,
	PRELOAD_FINISHED,
	PRELOAD_FAILED
} from './actions'

export default function _preload(
	location,
	// `previousLocation` is the location before the transition.
	// Is used for `instantBack`.
	previousLocation,
	routerArgs,
	server,
	onError,
	dispatch,
	getState,
	reportStats,
	onNavigate
) {
	const isInitialClientSideNavigation = !server && !previousLocation

	if (isInitialClientSideNavigation) {
		window._react_website_initial_location_key = location.key
	}

	// Indicates whether an `instantBack` `<Link/>` was clicked.
	const instantBack = !server && window._react_website_instant_back

	// Reset the flag for `wasInstantNavigation()`.
	// Will be set to `true` in `./source/redux/client/client.js`
	// if it was an "instant navigation" (instant `popstate` history transition).
	setInstantNavigationFlag(false)

	// If it's an instant "Back"/"Forward" navigation
	// then navigate to the page without preloading it.
	// (has been previously preloaded and is in Redux state)
	const _isInstantTransition = !server &&
		location.action === 'POP' &&
		previousLocation &&
		isInstantTransition(previousLocation, location)

	// On client-side page navigation
	if (onNavigate && !isInitialClientSideNavigation) {
		onNavigate(getLocationUrl(location), location)
	}

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

	// Measures time taken (on the client side)
	let startedAt

	if (!server) {
		// Measures time taken (on the client side)
		startedAt = Date.now()

		// If on the client side, then store the current pending navigation,
		// so that it can be cancelled when a new navigation process takes place
		// before the current navigation process finishes.

		// If there's preceeding navigation pending,
		// then cancel that previous navigation.
		if (previousPreloading && previousPreloading.pending && !previousPreloading.cancelled)
		{
			previousPreloading.cancel()
			// Page loading indicator could listen for this event.
			dispatch({ type: PRELOAD_FINISHED })
		}
	}

	const { routes, routeParams, params } = routerArgs

	// routes = getMatchedRoutes(getState(), routes)
	// const routeParams = getMatchedRoutesParams(getState())
	// const params = getRouteParams(getState())

	const components = routes.map(_ => _.Component)

	// Concatenated `react-router` route string.
	// E.g. "/user/:user_id/post/:post_id"
	const route = getRoutePath(routes)

	// On client-side page navigation
	if (!server && !isInitialClientSideNavigation) {
		updateMeta(getMeta(components, getState()))
	}

	// Instrument `dispatch`.
	// `dispatch` for server side `throw`s a special "redirect error" on redirect.
	// `dispatch` for client side cancels current `@preload()` on redirect.
	dispatch = instrumentDispatch(dispatch, server, preloading)

	// Preload all the required data for this route (page)
	let preload
	if (!_isInstantTransition)
	{
		preload = generatePreloadChain(
			isInitialClientSideNavigation,
			server,
			components,
			routeParams,
			getState,
			dispatch,
			location,
			params,
			preloading
		)
	}

	function onFinish() {
		if (!server) {
			afterPreload(
				dispatch,
				getState,
				location,
				previousLocation,
				params,
				components,
				routes,
				instantBack,
				_isInstantTransition
			)
		}
	}

	// If nothing to preload, just move to the next middleware
	if (!preload)
	{
		onFinish()
		// Allow the transition.
		return
	}

	// Page loading indicator could listen for this event
	dispatch({ type: PRELOAD_STARTED })

	// Preload the new page.
	// (the Promise returned is only used in server-side rendering,
	//  client-side rendering never uses this Promise)
	const promise = preload()

	preloading.pending = true

	// Preloading process cancellation
	preloading.cancel = () =>
	{
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

	const preloadTimer = timer()

	return promise.then(
		// Navigate to the new page
		() => {
			preloading.pending = false

			// Report stats to the web browser console
			if (!server) {
				console.log(`[react-website] @preload() took ${preloadTimer()} milliseconds for ${location.pathname}`)
			}

			// If this navigation process was cancelled
			// before @preload() finished its work,
			// then don't take any further steps on this cancelled navigation.
			if (preloading.cancelled) {
				// Return `false` out of the `Promise`
				// indicating that the navigation was cancelled.
				return false
			}

			// Page loading indicator could listen for this event
			dispatch({ type: PRELOAD_FINISHED })

			// Set the flag for `wasInstantNavigation()`.
			setInstantNavigationFlag(_isInstantTransition)

			// Report preloading time.
			// This preloading time will be longer then
			// the server-side one, say, by 10 milliseconds,
			// probably because the web browser making
			// an asynchronous HTTP request is slower
			// than the Node.js server making a regular HTTP request.
			// Also this includes network latency
			// for a particular website user, etc.
			// So this `preload` time doesn't actually describe
			// the server-side performance.
			if (reportStats) {
				reportStats({
					url: getLocationUrl(location),
					route,
					time: {
						preload: Date.now() - startedAt
					}
				})
			}

			onFinish()
		},
		(error) =>
		{
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

			// If the error was a redirection exception (not a error)
			// then just pass it up the stack.
			// (happens only on server side)
			if (server) {
				throw error
			}

			// Update preload status object
			preloading.pending = false

			// Possibly handle the error (for example, redirect to an error page).
			if (onError) {
				onError(error, {
					path : location.pathname,
					url  : getLocationUrl(location),
					// Using `redirect` instead of `goto` here
					// so that the user can't go "Back" to the page being preloaded
					// in case of an error because it would be in inconsistent state
					// due to `@preload()` being interrupted.
					redirect : to => dispatch(redirect(to)),
					getState,
					server
				})
			}

			throw error
		}
	)
}

function afterPreload(
	dispatch,
	getState,
	location,
	previousLocation,
	parameters,
	components,
	routes,
	instantBack,
	isInstantTransition
) {
	// Update instant back navigation chain.
	if (instantBack)
	{
		// Stores "current" (soon to be "previous") location
		// in "instant back chain", so that if "Back" is clicked
		// then such transition could be detected as "should be instant".
		addInstantBack(location, previousLocation, routes, window._react_website_current_page_routes)
	}
	else if (!isInstantTransition)
	{
		// If current transition is not "instant back" and not "instant"
		// then reset the whole "instant back" chain.
		// Only a consequitive "instant back" navigation chain
		// preserves the ability to instantly navigate "Back".
		// Once a regular navigation takes place
		// all previous "instant back" possibilities are discarded.
		resetInstantBack()
	}

	// `routes` are used when comparing `instantBack` chain items
	// for resetting `instantBack` chain when the same route is encountered twice.
	window._react_website_current_page_routes = routes

	// Call `onPageLoaded()`
	const page = components[components.length - 1]

	// The current `<Route/>` component might be `undefined`
	// if a developer forgot to `export default` it.
	if (page && page[ON_PAGE_LOADED_METHOD_NAME])
	{
		page[ON_PAGE_LOADED_METHOD_NAME]
		({
			dispatch,
			getState,
			location,
			parameters
		})
	}
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
				if (server) {
					// `throw`s a special redirection `Error` on server side.
					throwRedirectError(event.payload)
				} else {
					// On client side.
					// Discard the currently ongoing preloading.
					if (preloading.cancel) {
						preloading.cancel()
					}
					// Page loading indicator could listen for this event.
					dispatch({ type: PRELOAD_FINISHED })
				}
			default:
				// Proceed normally.
				return dispatch(event)
		}
		if (!server) {
			// Mark `http` calls so that they don't get "error handled" twice.
			// (doesn't affect anything, just a minor optimization)
			if (typeof event.promise === 'function') {
				event.preloading = true
			}
		}
	}
}