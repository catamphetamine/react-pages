import { createStore, combineReducers, applyMiddleware, compose } from 'redux'

import asynchronous_middleware from './middleware/asynchronous middleware'
import preloading_middleware from './middleware/preloading middleware'

import DevTools from './dev tools'

import { routerStateReducer } from 'redux-router'

import { createRoutes } from 'react-router/lib/RouteUtils'

import { reduxReactRouter as reduxReactRouter_client } from 'redux-router'
import { reduxReactRouter as reduxReactRouter_server } from 'redux-router/server'

import createHistory_server from 'history/lib/createMemoryHistory'
import createHistory_client from 'history/lib/createBrowserHistory'

// import use_scroll from 'scroll-behavior'

export default function(get_reducer, { development, development_tools, server, data, create_routes, http_client, on_preload_error, middleware, on_store_created })
{
	// server-side and client-side specifics
	const reduxReactRouter = server ? reduxReactRouter_server : reduxReactRouter_client
	const createHistory    = server ? createHistory_server    : createHistory_client

	// Simply using `useScroll` from `scroll-behavior@0.7.0`
	// introduces scroll jumps to top when navigating the app
	// while navigation is asynchronous and takes some time to finish,
	// therefore it creates a scrollbar "jumping" effect.
	//
	// const createHistory = server ? createHistory_server    : () => use_scroll(createHistory_client())
	//
	// Therefore using a middleware to wait for page loading to finish.

	// generates the three promise event names automatically based on a base event name
	const promise_event_naming = event_name => [`${event_name} pending`, `${event_name} done`, `${event_name} failed`]

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
		asynchronous_middleware(http_client, { promise_event_naming }),

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
			window.devToolsExtension ? window.devToolsExtension() : DevTools.instrument(),
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
		const reducers = get_reducer()
		reducers.router = routerStateReducer
		return combineReducers(reducers)
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

	// `reload` helper function gives the web application means to hot reload its Redux reducers
	if (on_store_created)
	{
		on_store_created
		({
			reload_reducer: () => store.replaceReducer(overall_reducer())
		})
	}

	// return the created Redux store
	return store
}
