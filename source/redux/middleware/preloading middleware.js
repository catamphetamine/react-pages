// enables support for @preload() annotation
// (which preloads data required for displaying certain pages)
//
// takes effect if the `dispatch`ed message has 
// { type: ROUTER_DID_CHANGE }
//
// in all the other cases it will do nothing

import { ROUTER_DID_CHANGE } from 'redux-router/lib/constants'
import { replaceState }      from 'redux-router'

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
	// ("getState().router" means "is on the client side now")
	//
	if (getState().router)
	{
		let previous_route_components = getState().router.components

		while (previous_route_components[0] === components[0])
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
	const blocking_preloads = get_preloaders('preload_blocking')

	// get all `preload` methods on the React-Router component chain
	const preloads = get_preloaders('preload')

	// calls all `preload` methods on the React-Router component chain
	// (in parallel) and returns a Promise
	const preload_all = () => 
	{
		return Promise.all((preloads || []).map(preload =>
		{
			const promise = preload()

			// sanity check
			if (!promise.then)
			{
				return Promise.reject(`Preload function didn't return a Promise:`, preload)
				// throw new Error(`Preload function didn't return a Promise:`, preload)
			}

			return promise
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
				const promise = preload()
				
				// sanity check
				if (!promise.then)
				{
					return Promise.reject(`Preload function didn't return a Promise:`, preload)
					// throw new Error(`Preload function didn't return a Promise:`, preload)
				}

				return promise
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

const locations_are_equal = (a, b) => (a.pathname === b.pathname) && (a.search === b.search)

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

		// on the server side any error arising here 
		// will be handled by webpage rendering server.
		// explicit error handling here is only needed for the client.
		//
		let error_handler
		//
		if (!server)
		{
			// outputs error to the console by default
			on_error = on_error || (error => console.error(error.stack || error))

			// Promise error handler
			error_handler = error => 
			{
				// finish the current Redux middleware chain
				next(action)
				
				// handle the error (for example, redirect to an error page)
				on_error(error,
				{
					error, 
					url      : action.payload.location.pathname + action.payload.location.search,

					// for some strange reason the `dispatch` function 
					// from the middleware parameters doesn't work here 
					// when `redirect()`ing from this `on_error` handler
					redirect : to => dispatch_event(replaceState(null, to)),

					// // finish the current Redux middleware chain
					// // (not used really)
					// proceed  : () => next(action)
				})
			}
		}

		const { components, location, params } = action.payload

		// preload all the required data for this route
		const preload = preloader(server, components, getState, dispatch, location, params)

		// if nothing to preload, just move to the next middleware
		if (!preload)
		{
			return next(action)
		}
		
		dispatch({ type: Preload_started })

		// will return this Promise
		const promise = 
			// preload this route
			preload()
			// proceed with routing
			.then
			(
				() =>
				{
					dispatch({ type: Preload_finished })

					next(action)
				}, 
				error =>
				{
					dispatch({ type: Preload_failed, error })

					if (error_handler)
					{
						error_handler(error)
					}
				}
			)

			// // check for errors
			// .catch(error =>
			// {
			// 	console.error(error.stack || error)
			// })
			// then
			// .then(() =>
			// {
			// 	// proceed with routing
			// 	next(action)
			//
			// 	// if on client-side
			// 	if (!server)
			// 	{
			// 		// preload all the deferred required data (if any)
			// 		get_data_dependencies(components, getState, dispatch, location, params, { deferred: true })
			// 		// check for errors
			// 		.catch(error => console.error(error.stack || error))
			// 		// done
			// 		.then(resolve)
			// 	}
			// })

		// on the server side
		if (server)
		{
			// router state is null until ReduxRouter is created (on the client) 
			// so we can use router state variable to store the promise 
			// to let the server know when it can render
			getState().router = promise
		}

		// preload() then proceed
		//
		// returning promise from a middleware is not required.
		// can be used like: store.dispatch({ ... }).then(...)
		// if all the previous middlewares do `return next(action)`
		// (which is the case when navigating React-router routes)
		return promise
	}
}

export const Preload_started  = '@@react-isomorphic-render/redux/preload started'
export const Preload_finished = '@@react-isomorphic-render/redux/preload finished'
export const Preload_failed   = '@@react-isomorphic-render/redux/preload failed'