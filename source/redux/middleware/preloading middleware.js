// enables support for @preload() decorator
// (which preloads data required for displaying certain pages)

import { location_url } from '../../location'
import { Preload, redirect_action, goto_action } from '../actions'
import match_routes_against_location from '../../react-router/match'

export const Preload_method_name  = '__preload__'
export const Preload_options_name = '__preload_options__'

export const Preload_started  = '@@react-isomorphic-render/redux/preload started'
export const Preload_finished = '@@react-isomorphic-render/redux/preload finished'
export const Preload_failed   = '@@react-isomorphic-render/redux/preload failed'

export default function preloading_middleware(server, error_handler, dispatch_event, preload_helpers, routes, history)
{
	return ({ getState, dispatch }) => next => action =>
	{
		// Handle only `Preload` actions
		if (action.type !== Preload)
		{
			// Do nothing
			return next(action)
		}

		// Promise error handler
		const handle_error = error => 
		{
			// If no `on_preload_error` handler was set,
			// then use default behaviour.
			if (!error_handler)
			{
				// This error will be handled in `web server` `catch` clause
				// if this code is being run on the server side.
				if (server)
				{
					throw error
				}

				// On the client-side outputs errors to console by default
				return console.error(error.stack || error)
			}

			// Handle the error (for example, redirect to an error page)
			error_handler(error,
			{
				url : location_url(action.payload.location),

				redirect(to)
				{
					// There were reports that `dispatch_event()`
					// used to reach deeper than simply `dispatch()`.
					// Therefore passing it here.
					// Maybe that info could be rechecked.
					dispatch_event(replace_action(to))
				},

				// There were reports that `dispatch_event()`
				// used to reach deeper than simply `dispatch()`.
				// Therefore passing it here.
				// Maybe that info could be rechecked.
				dispatch: dispatch_event,
				getState
			})

			// On the server-side the page rendering process
			// still needs to be aborted, therefore rethrow the error.
			// `on_preload_error` must handle all errors,
			// which means it either `redirect`s or re`throw`s,
			// which are both `throw`s, so with a proper
			// `on_preload_error` handler this code wouldn't be reached.
			if (server)
			{
				throw new Error(`"on_preload_error" must either redirect or rethrow the error`)
			}
		}

		// There were reports that `dispatch_event()`
		// used to reach deeper than simply `dispatch()`.
		// Therefore passing it here.
		// Maybe that info could be rechecked.
		return match_routes_against_location
		({
			routes: typeof routes === 'function' ? routes({ dispatch: dispatch_event, getState }) : routes,
			history,
			location: action.location
		})
		.then(({ redirect, router_state }) =>
		{
			if (redirect)
			{
				// Shouldn't happen on the server-side in the current setup
				if (server)
				{
					const error = new Error('This is not an error. It\'s just a redirect.')
					error._redirect = location_url(redirect)
					throw error
				}

				return dispatch_event(redirect_action(redirect))
			}

			const { components, location, params } = router_state

			// Preload all the required data for this route (page)
			const preload = preloader(server, components, getState, dispatch_event, location, params, preload_helpers)

			// If nothing to preload, just move to the next middleware
			if (!preload)
			{
				// On client side, navigate to the page after it has been preloaded
				if (!server)
				{
					return dispatch_event(goto_action(location))
				}

				// On server side, just do nothing
				return
			}

			// `window.__preloading_page` holds client side page preloading status.
			// If there's preceeding navigation pending, then cancel that previous navigation.
			if (!server && window.__preloading_page && !window.__preloading_page.cancelled)
			{
				// window.__preloading_page.promise.cancel()
				window.__preloading_page.cancelled = true
			}

			// Page loading indicator could listen for this event
			dispatch_event({ type: Preload_started })

			// Holds the cancellation flag for this navigation process
			const preloading = { cancelled: false }

			// If on the client side, then store the current pending navigation,
			// so that it can be cancelled when a new navigation process takes place
			// before the current navigation process finishes.
			if (!server)
			{
				// preloading.promise = promise
				window.__preloading_page = preloading
			}

			// This Promise is only used in server-side rendering.
			// Client-side rendering never uses this Promise.
			
			// preload this route
			return preload()
				// proceed with routing
				.then(() =>
				{
					// If this navigation process was cancelled
					// before @preload() finished its work,
					// then don't take any further steps on this cancelled navigation.
					if (preloading.cancelled)
					{
						return
					}

					// Page loading indicator could listen for this event
					dispatch_event({ type: Preload_finished })

					// Trigger `react-router` navigation on client side
					// (and do nothing on server side)
					if (!server)
					{
						dispatch_event(goto_action(location))
					}
				})
				.catch(error =>
				{
					// If this navigation process was cancelled
					// before @preload() finished its work,
					// then don't take any further steps on this cancelled navigation.
					if (preloading.cancelled)
					{
						return
					}

					// If the error was a redirection exception (not a error),
					// then just exit and do nothing.
					// (happens only on server side or when using `onEnter` helper)
					if (error._redirect)
					{
						if (!server)
						{
							// Page loading indicator could listen for this event
							dispatch_event({ type: Preload_finished })

							return dispatch_event(redirect_action(error._redirect))
						}

						throw error
					}

					// Page loading indicator could listen for this event
					dispatch_event({ type: Preload_failed, error })

					// Handle preloading error
					// (either `redirect` to an "error" page
					//  or rethrow the error up the Promise chain)
					handle_error(error)
				})
		})
	}
}

// Returns function returning a Promise 
// which resolves when all the required preload()s are resolved.
//
// If no preloading is needed, then returns nothing.
//
const preloader = (server, components, getState, dispatch, location, parameters, preload_helpers) =>
{
	let preload_arguments = { dispatch, getState, location, parameters }

	if (preload_helpers)
	{
		preload_arguments = { ...preload_arguments, ...preload_helpers }
	}

	// on the client side:
	//
	// take the previous route components 
	// and the next route components,
	// and compare them side-by-side
	// filtering out the same top level components.
	//
	// therefore @preload() methods won't be called
	// for those top level components which remain the same.
	//
	// (e.g. the main <Route/> will be @preload()ed only once - on the server side)
	//
	// at the same time, at least one component should be preloaded,
	// because a route might have a form of "/users/xxx",
	// and therefore after navigating from "/users/xxx" to "/users/yyy"
	// the last component in the chain still needs to be reloaded
	// even though it has remained the same.
	//
	// `params` comparison could render the above workaround obsolete,
	// but `react-router` doesn't provide per-route params
	// instead providing page-wide `params`
	// (i.e. combined `params` from all routes of the routed path),
	// and there's no way of simply doing `if (previous_params !== new_params) { preload() }`
	// because that would re-@preload() all parent components every time
	// even if they stayed the same (e.g. the root `<App/>` route component).
	//
	// (also, GET query parameters would also need to be compared in that case)
	//
	// if (!server)
	// {
	// 	let previous_route_components = getState().router.components

	// 	while (components.length > 1 && previous_route_components[0] === components[0])
	// 	{
	// 		previous_route_components = previous_route_components.slice(1)
	// 		components                = components.slice(1)
	// 	}
	// }

	// finds all `preload` (or `preload_deferred`) methods 
	// (they will be executed in parallel)
	function get_preloaders()
	{
		// find all `preload` methods on the React-Router component chain
		return components
			.filter(component => component && component[Preload_method_name])
			.map(component =>
			({
				preload: () =>
				{
					try
					{
						// `preload()` returns a Promise
						let promise = component[Preload_method_name](preload_arguments)

						// Sanity check
						if (typeof promise.then !== 'function')
						{
							return Promise.reject(`Preload function didn't return a Promise:`, preload)
						}

						// Convert `array`s into `Promise.all(array)`
						if (Array.isArray(promise))
						{
							promise = Promise.all(promise)
						}

						return promise
					}
					catch (error)
					{
						return Promise.reject(error)
					}
				},
				options: component[Preload_options_name] || {}
			}))
	}

	// Get all `preload` methods on the React-Router component chain
	const preloads = get_preloaders()

	// Construct `preload` chain

	let chain = []
	let parallel = []

	for (let preloader of get_preloaders())
	{
		if (preloader.options.blocking === false)
		{
			parallel.push(preloader.preload)
			continue
		}

		// Copy-pasta
		if (parallel.length > 0)
		{
			parallel.push(preloader.preload)
			chain.push(parallel)
			parallel = []
		}
		else
		{
			chain.push(preloader.preload)
		}
	}

	// Copy-pasta
	if (parallel.length > 0)
	{
		chain.push(parallel.length > 1 ? parallel : parallel[0])
		parallel = []
	}

	// Convert `preload` chain into `Promise` chain

	if (chain.length === 0)
	{
		return
	}

	return function()
	{
		return chain.reduce((promise, link) =>
		{
			if (Array.isArray(link))
			{
				return promise.then(() => Promise.all(link.map(_ => _())))
			}

			return promise.then(link)
		},
		Promise.resolve())
	}
}