// enables support for @preload() annotation
// (which preloads data required for displaying certain pages)
//
// takes effect if the `dispatch`ed message has 
// { type: ROUTER_DID_CHANGE }
//
// in all the other cases it will do nothing

import { ROUTER_DID_CHANGE } from 'redux-router/lib/constants'
import { replace }           from 'redux-router'

export const Preload_method_name          = '__react_preload___'
export const Preload_blocking_method_name = '__react_preload_blocking__'

// Returns function returning a Promise 
// which resolves when all the required preload()s are resolved.
//
// If no preloading is needed, then returns nothing.
//
const preloader = (server, components, getState, dispatch, location, params, options = {}) =>
{
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
	// ("getState().router" means "is on the client side now")
	//
	if (getState().router)
	{
		let previous_route_components = getState().router.components

		while (components.length > 1 && previous_route_components[0] === components[0])
		{
			previous_route_components = previous_route_components.slice(1)
			components                = components.slice(1)
		}
	}

	// if you have `disable_server_side_rendering` set to true 
	// then there is a possibility @preload() won't work for top level components.
	// however `disable_server_side_rendering` is not a documented feature
	// therefore it's not officially supported and therefore it's not really a bug.
	//
	// if someone needs `disable_server_side_rendering`
	// with @preload()ing on the root React component
	// then they can submit a Pull Request fixing this.

	// finds all `preload` (or `preload_deferred`) methods 
	// (they will be executed in parallel)
	function get_preloaders(method_name)
	{
		// find all `preload` methods on the React-Router component chain
		return components
			.filter(component => component && component[method_name]) // only look at ones with a static preload()
			.map(component => component[method_name]) // pull out preloading methods
			.map(preload => () => preload(dispatch, getState, location, params)) // bind arguments
	}

	// get all `preload_blocking` methods on the React-Router component chain
	const blocking_preloads = get_preloaders(Preload_blocking_method_name)

	// get all `preload` methods on the React-Router component chain
	const preloads = get_preloaders(Preload_method_name)

	// calls all `preload` methods on the React-Router component chain
	// (in parallel) and returns a Promise
	const preload_all = () => 
	{
		return Promise.all(preloads.map(preload =>
		{
			try
			{
				// `preload()` returns a Promise
				const promise = preload()

				// Sanity check
				if (!promise.then)
				{
					return Promise.reject(`Preload function didn't return a Promise:`, preload)
					// throw new Error(`Preload function didn't return a Promise:`, preload)
				}

				return promise
			}
			catch (error)
			{
				return Promise.reject(error)
			}
		}))
	}

	// calls all `preload_blocking` methods on the React-Router component chain
	// (sequentially) and returns a Promise
	const preload_all_blocking = () =>
	{
		return (blocking_preloads || []).reduce((previous, preload) =>
		{
			return previous.then(() =>
			{
				try
				{
					const promise = preload()

					// sanity check
					if (!promise.then)
					{
						return Promise.reject(`Preload function didn't return a Promise:`, preload)
						// throw new Error(`Preload function didn't return a Promise:`, preload)
					}

					return promise
				}
				catch (error)
				{
					return Promise.reject(error)
				}
			})
		}, 
		Promise.resolve())
	}

	// if there are `preload_blocking` methods on the React-Router component chain,
	// then finish them first (sequentially)
	if (blocking_preloads.length > 0)
	{
		// first finish `preload_blocking` methods, then call all `preload`s
		return () => preload_all_blocking().then(preload_all)
	}

	// no `preload_blocking` methods, just call all `preload`s, if any
	if (preloads.length > 0)
	{
		return preload_all
	}
}

// Checks if two `location`s are the same
const locations_are_equal = (a, b) => (a.pathname === b.pathname) && (a.search === b.search)

// Because `preloading_middleware` is `applied` to the store
// before `reduxReactRouter` store enhancer adds its own middleware,
// then it means that standard `dispatch` of `preloading_middleware`
// won't send actions to that `reduxReactRouter` middleware,
// therefore there's the third `dispatch_event` argument
// which is a function to hack around that limitation.
export default function(server, on_error, dispatch_event)
{
	return ({ getState, dispatch }) => next => action =>
	{
		// if it isn't a React-router navigation event then do nothing
		if (action.type !== ROUTER_DID_CHANGE)
		{
			// do nothing
			return next(action)
		}

		// when routing is initialized on the client side
		// then ROUTER_DID_CHANGE event will be fired,
		// so ignore this event.
		// ("getState().router" means "is on the client side now")
		if (getState().router && locations_are_equal(action.payload.location, getState().router.location))
		{
			// ignore the event
			return next(action)
		}

		// Promise error handler
		const error_handler = error => 
		{
			// If no `on_preload_error` handler was set,
			// then use default behaviour.
			if (!on_error)
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
			on_error(error,
			{
				url : action.payload.location.pathname + action.payload.location.search,

				redirect(to)
				{
					// Because `preloading_middleware` is `applied` to the store
					// before `reduxReactRouter` store enhancer adds its own middleware,
					// then it means that standard `dispatch` of `preloading_middleware`
					// won't send actions to that `reduxReactRouter` middleware,
					// therefore using this `dispatch_event` function to hack around that.
					dispatch_event(replace(to))
				}
			})

			// On the server-side the page rendering process
			// still needs to be aborted, therefore rethrow the error,
			// while also marking it as handled.
			if (server)
			{
				error._was_handled = true
				throw error
			}
		}

		// all these three properties are the next React-router state
		// (taken from `history.listen(function(error, nextRouterState))`)
		const { components, location, params } = action.payload

		// preload all the required data for this route
		const preload = preloader(server, components, getState, dispatch, location, params)

		// if nothing to preload, just move to the next middleware
		if (!preload)
		{
			return next(action)
		}

		// // `window.__preloading_page` holds client side page preloading status.
		// // can be used to cancel navigation.

		// if (!server && window.__preloading_page && window.__preloading_page.pending)
		// {
		// 	// window.__preloading_page.promise.cancel()
		// 	window.__preloading_page.pending = false
		// }
		
		dispatch({ type: Preload_started })

		// const preloading = { pending: true }

		// This Promise is only used in server-side rendering.
		// Client-side rendering never uses this Promise.
		const promise = 
			// preload this route
			preload()
			// proceed with routing
			.then(() =>
			{
				// if (!preloading.pending)
				// {
				// 	return
				// }

				dispatch({ type: Preload_finished })

				next(action)
			})
			.catch(error =>
			{
				// if (!preloading.pending)
				// {
				// 	return
				// }

				// Reset the Promise temporarily placed into the router state 
				// by the code below
				// (fixes "Invariant Violation: `mapStateToProps` must return an object. Instead received [object Promise]")
				if (server)
				{
					getState().router = null
				}

				dispatch({ type: Preload_failed, error })

				error_handler(error)
			})
			// .finally(() => preloading.pending = false)

		// if (!server)
		// {
		// 	preloading.promise = promise
		// 	window.__preloading_page = preloading
		// }

		// On the server side
		if (server)
		{
			// `state.router` is null until `replaceRoutesMiddleware` is called 
			// with the currently paused ROUTER_DID_CHANGE action as a parameter
			// in a subsequent middleware call, so until that next middleware is called
			// we can use this router state variable to store the promise 
			// to let the server know when it can render the page.
			//
			// This variable will be instantly available
			// (and therefore .then()-nable)
			// in ./source/redux/render.js,
			// and when everything has finished preloading (asynchronously), 
			// then the next middleware is called,
			// `replaceRoutesMiddleware` gets control,
			// and replaces `state.router` with the proper Redux-router router state. 
			//
			// (the `promise` above could still resolve instantly, hence the `if` check)
			//
			if (!getState().router)
			{
				getState().router = promise
			}
		}
	}
}

export const Preload_started  = '@@react-isomorphic-render/redux/preload started'
export const Preload_finished = '@@react-isomorphic-render/redux/preload finished'
export const Preload_failed   = '@@react-isomorphic-render/redux/preload failed'