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

		// Enables support for @preload() annotation
		// (which preloads data required for displaying certain pages)
		//
		// Yakes effect if the `dispatch`ed message has 
		// { type: ROUTER_DID_CHANGE }
		//
		// In all the other cases it will do nothing
		//
		// Because `preloading_middleware` is `applied` to the store
		// before `reduxReactRouter` store enhancer adds its own middleware,
		// then it means that standard `dispatch` of `preloading_middleware`
		// won't send actions to that `reduxReactRouter` middleware,
		// therefore using the third argument to hack around this thing.
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

	// Because History API won't work on the server side,
	// instrument it with redirection handlers (isomorphic redirection)
	if (server)
	{
		// A hacky way but it should work
		// for calling `redirect` from anywhere
		// inside `@preload` Promise.
		//
		// this.props.dispatch(redirect(url)) is synchronous,
		// and so is `redux-router`'s `historyMiddleware`,
		// so throwing an error should abort further actions
		// and bring it to the top of the call stack
		// (`render` function) where it's processed properly.
		//
		const redirect = (url) =>
		{
			if (!url)
			{
				throw new Error(`"url" parameter is required for redirect`)
			}

			const error = new Error('redirect')
			error._redirect = url || '/'
			throw error
		}

		store.history.replace = redirect
		store.history.push    = redirect
	}
	
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
