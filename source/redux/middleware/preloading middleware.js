// enables support for @preload() annotation
// (which preloads data required for displaying certain pages)
//
// takes effect if the `dispatch`ed message has 
// { type: ROUTER_DID_CHANGE }
//
// in all the other cases it will do nothing

import { ROUTER_DID_CHANGE } from 'redux-router/lib/constants'
import { replaceState }      from 'redux-router'

// returns a promise which resolves when all the required preload()s are resolved
// (`preload_deferred` is not used anywhere currently; maybe it will get removed from the code)
const get_data_dependencies = (components, getState, dispatch, location, params, options = {}) =>
{
	// determine if it's `preload` or `preload_deferred`
	const method_name = options.deferred ? 'preload_deferred' : 'preload'

	// calls all `preload` (or `preload_deferred`) methods 
	// (in parallel)
	function preload_all()
	{
		return Promise.all
		(
			components
				.filter(component => component && component[method_name]) // only look at ones with a static preload()
				.map(component => component[method_name])    // pull out fetch data methods
				.map(preload => preload(dispatch, getState, location, params))  // call fetch data methods and save promises
		)
	}

	// if `preload_deferred` then just call them all
	if (options.deferred)
	{
		return preload_all()
	}

	// if there are `preload_blocking` methods on the React-Router component chain,
	// then finish them first (sequentially, because it's a waterfall model).
	return components
		.filter(component => component && component.preload_blocking) // only look at ones with a static preload_blocking()
		.map(component => component.preload_blocking)    // pull out fetch data methods
		.reduce((previous, preload) => previous.then(() => preload(dispatch, getState, location, params)), Promise.resolve())
	
		// first finish `preload_blocking` methods, then call all `preload`s
		.then(preload_all)
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

		// if the location hasn't changed then do nothing
		// (it seemed to be a kind of a weird semi-bug, maybe now it's obsolete
		//  and maybe this if condition can be removed in the future)
		if (getState().router && locations_are_equal(action.payload.location, getState().router.location))
		{
			// do nothing
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

		// will return this Promise
		const promise = 
			// preload all the required data
			get_data_dependencies(components, getState, dispatch, location, params)
			// proceed with routing
			.then(() => next(action), error_handler)

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