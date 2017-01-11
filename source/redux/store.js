import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { createRoutes } from 'react-router/lib/RouteUtils'

import asynchronous_middleware from './middleware/asynchronous middleware'
import preloading_middleware from './middleware/preloading middleware'
import history_middleware from './middleware/history middleware'

import { useRouterHistory } from 'react-router'

export default function create_store(createHistory, reducer, { devtools, server, data, routes, http_client, asynchronous_action_event_naming, on_preload_error, middleware, on_store_created, preload_helpers, history_options })
{
	// Redux store enhancers
	const store_enhancers = []

	// User may supply his own Redux middleware
	if (middleware)
	{
		const middleware_list = middleware()
		if (middleware_list.length > 0)
		{
			store_enhancers.push(applyMiddleware(...middleware_list))
		}
	}

	const history = useRouterHistory(createHistory)(history_options)

	// Redux middlewares are applied in reverse order
	// (which is counter-intuitive)
	const middlewares =
	[
		// Enables support for Ajax Http requests.
		//
		// Takes effect if the `dispatch`ed message has 
		// { promise: ... }
		//
		// In all the other cases it will do nothing.
		//
		// Because `asynchronous_middleware` is `applied` to the store
		// before user-supplied middleware, it means that standard `dispatch`
		// of `asynchronous_middleware` won't send actions to user-supplied middleware,
		// therefore there's an additional `dispatch_event` argument
		// which is a function to hack around that limitation.
		//
		asynchronous_middleware(http_client, event => store.dispatch(event), { asynchronous_action_event_naming }),

		// Enables support for @preload() decorator
		// (which preloads data required for displaying certain pages).
		//
		preloading_middleware(server, on_preload_error, event => store.dispatch(event), preload_helpers, routes, history),

		history_middleware(history)
	]

	// Redux middlewares are applied in reverse order
	// (which is counter-intuitive)
	store_enhancers.push
	(
		// Ajax and @preload middleware (+ optional others).
		// Redux middlewares are applied in reverse order
		// (which is counter-intuitive)
		applyMiddleware(...middlewares)
	)

	// Add Redux DevTools (if they're enabled)
	if (process.env.NODE_ENV !== 'production' && !server && devtools)
	{
		// Redux middlewares are applied in reverse order
		// (which is counter-intuitive)
		store_enhancers.push
		(
			// Provides support for DevTools
			window.devToolsExtension ? window.devToolsExtension() : devtools.component.instrument(),
			// Lets you write ?debug_session=<name> in address bar to persist debug sessions
			devtools.persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
		)
	}

	// Creates Redux reducer
	const overall_reducer = (reducer) =>
	{
		const reducers = typeof reducer === 'function' ? reducer() : reducer
		return combineReducers(reducers)
	}

	// create Redux store 
	// with the overall Redux reducer 
	// and the initial Redux store data (aka "the state")
	const store = compose(...store_enhancers)(createStore)(overall_reducer(reducer), data)

	// This `history` is later used in `./client/render.js`
	store.history = history

	// Because History API won't work on the server side,
	// instrument it with redirection handlers (isomorphic redirection)
	if (server)
	{
		// A hacky way but it should work
		// for calling `redirect` from anywhere
		// inside `@preload` Promise.
		//
		const redirect = (url) =>
		{
			if (!url)
			{
				throw new Error(`"url" parameter is required for redirect`)
			}

			// If it's a relative URL, then prepend `history` `basename` to it
			if (url[0] === '/' && history_options && history_options.basename)
			{
				url = history_options.basename + url
			}

			const error = new Error(`Redirecting to ${url} (this is not an error)`)
			error._redirect = url
			throw error
		}

		store.history.replace = redirect
		store.history.push    = redirect
	}

	// `hot_reload` helper function gives the web application means to hot reload its Redux reducers
	store.hot_reload = reducer => store.replaceReducer(overall_reducer(reducer))
	store.hotReload = store.hot_reload

	// return the created Redux store
	return store
}
