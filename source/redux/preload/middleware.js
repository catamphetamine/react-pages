// Makes @preload() decorator work.
// (preloads data required for displaying a page before actually navigating to it)

import { location_url, strip_basename } from '../../location'
import server_redirect from '../../server redirect'

import {
	Redirect,
	GoTo,
	redirect_action,
	goto_action,
	history_redirect_action,
	history_goto_action
} from '../actions'

import {
	Preload
} from './actions'

import match_routes_against_location, { get_route_path } from '../../react-router/match'
import { add_instant_back, reset_instant_back } from '../client/instant back'
import timer from '../../timer'
import { get_meta, update_meta } from '../../meta/meta'

import { On_page_loaded_method_name } from './onPageLoaded'

import generate_preload_chain from './collect'

import {
	Preload_started,
	Preload_finished,
	Preload_failed
} from './actions'

export default function preloading_middleware
(
	server,
	error_handler,
	routes,
	get_history,
	basename,
	report_stats,
	onNavigate
)
{
	return ({ getState, dispatch }) => next => action =>
	{
		// Handle only `Preload` actions
		if (action.type !== Preload)
		{
			// Do nothing
			return next(action)
		}

		// Reset the flag for `wasInstantNavigation()`.
		// Will be set to `true` in `./source/redux/client/client.js`
		// if it was an "instant navigation" (instant `popstate` history transition).
		if (!server) {
			window._react_isomorphic_render_was_instant_navigation = false
		}

		// If `dispatch(redirect(...))` is called, for example,
		// then the location doesn't contain `basename`,
		// so set `basename` here.
		// And, say, when a `<Link to="..."/>` is clicked
		// then `basename` is not set too, so setting it here too.
		action.location = strip_basename(action.location, basename)

		// `previous_location` is the location before the transition.
		// Is used for `instantBack`.
		const previous_location = get_history().getCurrentLocation()

		// This idea was discarded because state JSON could be very large.
		// // If navigation to a new page is taking place
		// // then store the current Redux state in history.
		// if (!server && action.navigate)
		// {
		// 	store_in_session('redux/state', get_history().getCurrentLocation().key, getState())
		// }

		// A special flavour of `dispatch` which `throw`s for redirects on the server side.
		dispatch = preloading_middleware_dispatch(dispatch, server)

		// On client-side page navigation
		if (onNavigate && !action.initial)
		{
			onNavigate(location_url(action.location), action.location)
		}

		// Preload status object.
		// `preloading` holds the cancellation flag for this navigation process.
		// (e.g. preloading `Promise` chain could be cancelled in case of a redirect)
		const preloading = {}

		// Can cancel previous preloading (on the client side)
		let previous_preloading
		if (!server)
		{
			previous_preloading = window.__preloading_page
			window.__preloading_page = preloading
		}

		function report_preload_stats(time, route)
		{
			// preloading.time = time

			// This preloading time will be longer then
			// the server-side one, say, by 10 milliseconds,
			// probably because the web browser making
			// an asynchronous HTTP request is slower
			// than the Node.js server making a regular HTTP request.
			// Also this includes network latency
			// for a particular website user, etc.
			// So this `preload` time doesn't actually describe
			// the server-side performance.
			if (report_stats)
			{
				report_stats
				({
					url : location_url(action.location),
					route,
					time:
					{
						preload: time
					}
				})
			}
		}

		return match_routes_against_location
		({
			routes   : typeof routes === 'function' ? routes({ dispatch, getState }) : routes,
			history  : get_history(),
			location : action.location
		})
		.then(({ redirect, router_state }) =>
		{
			// In case of a `react-router` `<Redirect/>`
			if (redirect)
			{
				// Shouldn't happen on the server-side in the current setup,
				// but just in case.
				if (server)
				{
					// Throws a special "redirection" error.
					server_redirect(redirect)
				}

				// Perform client side redirect
				// (with target page preloading)
				dispatch(redirect_action(redirect))
				// Explicitly return `undefined`
				// (not `false` by accident)
				return
			}

			// Measures time taken (on the client side)
			let started_at

			if (!server)
			{
				// Measures time taken (on the client side)
				started_at = Date.now()

				// If on the client side, then store the current pending navigation,
				// so that it can be cancelled when a new navigation process takes place
				// before the current navigation process finishes.

				// If there's preceeding navigation pending,
				// then cancel that previous navigation.
				if (previous_preloading && previous_preloading.pending && !previous_preloading.cancelled)
				{
					previous_preloading.cancel()
					// Page loading indicator could listen for this event
					dispatch({ type: Preload_finished })
				}
			}

			// Concatenated `react-router` route string.
			// E.g. "/user/:user_id/post/:post_id"
			const route = get_route_path(router_state)

			// `react-router` matched route "state"
			const { routes, components, location, params } = router_state

			// On client-side page navigation
			if (!server && !action.initial)
			{
				update_meta(get_meta(components, location, params, getState()))
			}

			// Preload all the required data for this route (page)
			let preload
			if (!action.instant)
			{
				preload = generate_preload_chain
				(
					action.initial,
					server,
					routes,
					components,
					getState,
					preloader_dispatch(dispatch, preloading),
					location,
					params,
					preloading
				)
			}

			// If nothing to preload, just move to the next middleware
			if (!preload)
			{
				after_preload(dispatch, getState, components, params, action, server, get_history, previous_location)
				// Explicitly return `undefined`
				// (not `false` by accident)
				return
			}

			// Page loading indicator could listen for this event
			dispatch({ type: Preload_started })

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
				if (promise.cancel)
				{
					// `.catch()` is to suppress "Uncaught promise rejection" errors
					promise.catch(() => ({})).cancel()
				}
			}

			const preload_timer = timer()

			return promise
				// Navigate to the new page
				.then(() =>
				{
					preloading.pending = false

					// Report stats to the web browser console
					if (!server)
					{
						console.log(`[react-website] @preload() took ${preload_timer()} milliseconds for ${action.location.pathname}`)
					}

					// If this navigation process was cancelled
					// before @preload() finished its work,
					// then don't take any further steps on this cancelled navigation.
					if (preloading.cancelled)
					{
						// Return `false` out of the `Promise`
						// indicating that the navigation was cancelled.
						return false
					}

					// Page loading indicator could listen for this event
					dispatch({ type: Preload_finished })

					// Report preloading time
					report_preload_stats(Date.now() - started_at, route)

					after_preload(dispatch, getState, components, params, action, server, get_history, previous_location)
				},
				(error) =>
				{
					// If this navigation process was cancelled
					// before @preload() finished its work,
					// then don't take any further steps on this cancelled navigation.
					if (!preloading.cancelled)
					{
						if (!server)
						{
							preloading.error = error
						}

						// Page loading indicator could listen for this event
						dispatch({ type: Preload_failed, error })
					}

					throw error
				})
		})
		.catch((error) =>
		{
			// Update preload status object
			preloading.pending = false
			// preloading.error = error

			// If the error was a redirection exception (not a error),
			// then just exit and do nothing.
			// (happens only on server side)
			if (server && error._redirect)
			{
				// No need to emit `Preload_finished`
				// since the current page is simply discarded.
				throw error
			}

			// Possibly handle the error (for example, redirect to an error page)
			if (error_handler)
			{
				error_handler(error,
				{
					path : action.location.pathname,
					url  : location_url(action.location),
					// Using `redirect_action` instead of `goto_action` here
					// so that the user can't go "Back" to the page being preloaded
					// in case of an error because it would be in inconsistent state
					// due to `@preload()` being interrupted.
					redirect : to => dispatch(redirect_action(to)),
					dispatch,
					getState,
					server
				})
			}

			// If redirect happened on the server side
			// then a special redirection error was thrown.
			// Otherwise just rethrow the error
			// (always the case on the client side).
			//
			// This error will be handled in `server/server.js` `catch` clause
			// if this code is being run on the server side.
			// On the client side it just outputs errors to console.
			//
			throw error
		})
	}
}

function after_preload(dispatch, getState, components, parameters, action, server, get_history, previous_location)
{
	if (!server)
	{
		// Trigger `react-router` navigation on client side.
		if (action.navigate)
		{
			const actionCreator = action.redirect ? history_redirect_action : history_goto_action
			dispatch(actionCreator(action.location))
		}

		// Update instant back navigation chain.
		if (action.instantBack)
		{
			// Stores "current" (soon to be "previous") location
			// in "instant back chain", so that if "Back" is clicked
			// then such transition could be detected as "should be instant".
			add_instant_back(get_history().getCurrentLocation(), previous_location)
		}
		else if (!action.instant)
		{
			// If current transition is not "instant back" and not "instant"
			// then reset the whole "instant back" chain.
			// Only a consequitive "instant back" navigation chain
			// preserves the ability to instantly navigate "Back".
			// Once a regular navigation takes place
			// all previous "instant back" possibilities are discarded.
			reset_instant_back()
		}
	}

	// Call `onPageLoaded()`
	const page = components[components.length - 1]

	// The current `<Route/>` component might be `undefined`
	// if a developer forgot to `export default` it.
	if (!page) {
		throw new Error('The current `<Route/>` component is `undefined`. Make sure you didn\'t forget to `export default` it from the component file.')
	}

	if (page[On_page_loaded_method_name])
	{
		page[On_page_loaded_method_name]
		({
			dispatch,
			getState,
			location : action.location,
			parameters,
			history : get_history(),
			server
		})
	}
}

// A special flavour of `dispatch` which `throw`s for redirects on the server side.
function preloading_middleware_dispatch(dispatch, server)
{
	return (event) =>
	{
		switch (event.type)
		{
			// In case of navigation from @preload()
			case Preload:
				// `throw`s a special `Error` on server side
				if (server)
				{
					server_redirect(event.location)
				}
		}

		// Proceed with the original
		return dispatch(event)
	}
}

// A special flavour of `dispatch` for `@preload()` arguments.
// It detects redirection or navigation and cancels the current preload.
function preloader_dispatch(dispatch, preloading)
{
	return (event) =>
	{
		switch (event.type)
		{
			// In case of navigation from @preload()
			case Preload:
				// Discard the currently ongoing preloading
				preloading.cancel()
				// Page loading indicator could listen for this event
				dispatch({ type: Preload_finished })
		}

		// Mark `http` calls so that they don't get "error handled" twice
		// (doesn't affect anything, just a minor optimization)
		if (typeof event.promise === 'function')
		{
			event.preloading = true
		}

		// Proceed with the original
		return dispatch(event)
	}
}