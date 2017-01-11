// enables support for @preload() annotation
// (which preloads data required for displaying certain pages)
//
// takes effect if the `dispatch`ed message has 
// { type: ROUTER_DID_CHANGE }
//
// in all the other cases it will do nothing

import { match } from 'react-router'

// import { ROUTER_DID_CHANGE } from '../redux-router/constants'
// import { replace }           from '../redux-router'

import { location_url, locations_are_equal } from '../../location'

export const Preload_method_name  = '__preload__'
export const Preload_options_name = '__preload_options__'

export const Preload_started  = '@@react-isomorphic-render/redux/preload started'
export const Preload_finished = '@@react-isomorphic-render/redux/preload finished'
export const Preload_failed   = '@@react-isomorphic-render/redux/preload failed'

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

// Because `preloading_middleware` is `applied` to the store
// before `reduxReactRouter` store enhancer adds its own middleware,
// then it means that standard `dispatch` of `preloading_middleware`
// won't send actions to that `reduxReactRouter` middleware,
// therefore there's the third `dispatch_event` argument
// which is a function to hack around that limitation.
export default function preloading_middleware(server, error_handler, dispatch_event, preload_helpers, routes, history)
{
	return ({ getState, dispatch }) => next => action =>
	{
		if (action.type !== '@@react-isomorphic-render/preload')
		{
			// Do nothing
			return next(action)
		}

		// // If it isn't a `redux-router` navigation event then do nothing
		// if (action.type !== ROUTER_DID_CHANGE)
		// {
		// 	// Do nothing
		// 	return next(action)
		// }

		// // When routing is initialized on the client side
		// // then ROUTER_DID_CHANGE event will be fired,
		// // so ignore this initialization event.
		// if (!server && !getState().router)
		// {
		// 	// Ignore the event
		// 	return next(action)
		// }

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
					// Because `preloading_middleware` is `applied` to the store
					// before `reduxReactRouter` store enhancer adds its own middleware,
					// then it means that standard `dispatch` of `preloading_middleware`
					// won't send actions to that `reduxReactRouter` middleware,
					// therefore using this `dispatch_event` function to hack around that.
					dispatch_event(replace(to))
				},

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



		return match_promise(routes, {
			dispatch: dispatch_event,
			getState
		}, history, action.location).then(({ redirect, router_state }) =>
		{
			if (redirect)
			{
				// Shouldn't happen in the current setup
				if (server)
				{
					const error = new Error()
					error._redirect = location_url(redirect)
					throw error
				}

				return dispatch_event({ type: '@@react-isomorphic-render/redirect', location: redirect })
			}

			// All these three properties are the next `react-router` state
			// (taken from `history.listen(function(error, nextRouterState))`)
			// const { components, location, params } = action.payload
			const { components, location, params } = router_state

			// Preload all the required data for this route (page)
			const preload = preloader(server, components, getState, dispatch_event, location, params, preload_helpers)

			// If nothing to preload, just move to the next middleware
			if (!preload)
			{
				if (!server)
				{
					return dispatch_event({ type: '@@react-isomorphic-render/goto', location })
				}
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

					if (!server)
					{
						dispatch_event({ type: '@@react-isomorphic-render/goto', location })
					}

					// // Pass ROUTER_DID_CHANGE to redux-router middleware
					// // so that react-router renders the new route.
					// next(action)
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

							return dispatch_event({ type: '@@react-isomorphic-render/redirect', location: error._redirect })

							// return dispatch_event(replace(error._redirect))
						}

						throw error
					}

					// // Reset the Promise temporarily placed into the router state 
					// // by the code below
					// // (fixes "Invariant Violation: `mapStateToProps` must return an object.
					// //  Instead received [object Promise]")
					// if (server)
					// {
					// 	getState().router = null
					// }

					// Page loading indicator could listen for this event
					dispatch_event({ type: Preload_failed, error })

					// Handle preloading error
					// (either `redirect` to an "error" page
					//  or rethrow the error up the Promise chain)
					handle_error(error)
				})
		})

		// // On the server side
		// if (server)
		// {
		// 	// `state.router` is null until `replaceRoutesMiddleware` is called 
		// 	// with the currently paused ROUTER_DID_CHANGE action as a parameter
		// 	// in a subsequent middleware call, so until that next middleware is called
		// 	// we can use this router state variable to store the promise 
		// 	// to let the server know when it can render the page.
		// 	//
		// 	// This variable will be instantly available
		// 	// (and therefore .then()-nable)
		// 	// in ./source/redux/render.js,
		// 	// and when everything has finished preloading (asynchronously), 
		// 	// then the next middleware is called,
		// 	// `replaceRoutesMiddleware` gets control,
		// 	// and replaces `state.router` with the proper Redux-router router state. 
		// 	//
		// 	// (the `promise` above could still resolve instantly, hence the `if` check)
		// 	//
		// 	if (!getState().router)
		// 	{
		// 		getState().router = promise
		// 	}
		// }
	}
}

function match_promise(routes, store, history, location)
{
	routes = typeof routes === 'function' ? routes(store) : routes

	return new Promise((resolve, reject) =>
	{
		match({ history, routes, location }, (error, redirect_location, router_state) =>
		{
			if (error)
			{
				return reject(error)
			}
		
			if (redirect_location)
			{
				return resolve({ redirect: redirect_location })
			}
		
			return resolve({ router_state })
		})
	})
}