import { createStore, combineReducers, applyMiddleware, compose } from 'redux'

import asynchronous_middleware from './middleware/asynchronous middleware'
import preloading_middleware from './middleware/preloading middleware'

import dev_tools from './dev tools'

import { routerStateReducer } from 'redux-router'

import { createRoutes } from 'react-router/lib/RouteUtils'

import { reduxReactRouter as reduxReactRouter_client } from 'redux-router'
import { reduxReactRouter as reduxReactRouter_server } from 'redux-router/server'

import createHistory_server from 'history/lib/createMemoryHistory'
import createHistory_client from 'history/lib/createBrowserHistory'

// Three different types of scroll behavior available.
// Documented at https://github.com/rackt/scroll-behavior
//
// Possibly currently doesn't make any difference
import use_scroll from 'scroll-behavior/lib/useStandardScroll'

export default function(get_reducers, { development, development_tools, server, data, create_routes, http_client, on_preload_error, middleware })
{
	// whether to return a `reload()` helper function 
	// to hot reload web application's Redux reducers
	let reloadable = true

	// allows simplified store creation 
	// (with reducer object instead of a function returning reducer object)
	if (typeof get_reducers !== 'function')
	{
		// generate proper `get_reducers` function
		const reducers = get_reducers
		get_reducers = () => reducers

		// no way to reload store in this case
		// (or if there is the open an issue on github)
		reloadable = false
	}

	// server-side and client-side specifics
	const reduxReactRouter = server ? reduxReactRouter_server : reduxReactRouter_client
	const createHistory    = server ? createHistory_server    : use_scroll(createHistory_client)

	// Redux middleware chain
	let middleware_chain = 
	[
		// enables support for Ajax Http requests
		//
		// takes effect if the `dispatch`ed message has 
		// { promise: ... }
		//
		// in all the other cases it will do nothing
		//
		asynchronous_middleware(http_client),

		// enables support for @preload() annotation
		// (which preloads data required for displaying certain pages)
		//
		// takes effect if the `dispatch`ed message has 
		// { type: ROUTER_DID_CHANGE }
		//
		// in all the other cases it will do nothing
		//
		// (passing the additional `dispatch`ing function as the 3rd parameter)
		//
		preloading_middleware(server, on_preload_error, event => store.dispatch(event))
	]

	// user may supply his own middleware
	if (middleware)
	{
		middleware_chain = middleware(middleware_chain)
	}
	
	// Store creation function
	let create_store

	// Generate store creation function
	if (development && !server && development_tools)
	{
		const { persistState } = require('redux-devtools')

		create_store = compose
		(
			applyMiddleware(...middleware_chain),
			// Provides support for DevTools:
			dev_tools.instrument(),
			// Lets you write ?debug_session=<name> in address bar to persist debug sessions
			persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
		)
		(createStore)
	} 
	else
	{
		create_store = applyMiddleware(...middleware_chain)(createStore)
	}

	// enable redux-router (adds its own middleware)
	// (redux-router keeps react-router state in Redux)
	create_store = reduxReactRouter({ getRoutes: create_routes, createHistory })(create_store)

	// adds redux-router reducers to the list of all reducers.
	// overall Redux reducer = web application reducers + redux-router reducer
	const overall_reducer = () =>
	{
		const model = get_reducers()
		model.router = routerStateReducer
		return combineReducers(model)
	}

	// create Redux store 
	// with the overall Redux reducer 
	// and the initial Redux store data (aka "the state")
	const store = create_store(overall_reducer(), data)
	
	// // client side hot module reload for Redux reducers attempt
	// // (won't work because it's not an immediate parent module for the reducers)
	// // https://github.com/webpack/webpack/issues/1790
	// if (development && module.hot)
	// {
	// 	module.hot.accept(reducers_path, () =>
	// 	{
	// 		store.replaceReducer(overall_reducer())
	// 	})
	// }

	// return the created Redux store

	// if no hot reload is needed, then simply return the Redux store
	if (!reloadable)
	{
		return store
	}

	// return the Redux store and the `reload` helper function:
	// it gives the web application means to hot reload its Redux reducers
	return { store, reload: () => store.replaceReducer(overall_reducer()) }
}
