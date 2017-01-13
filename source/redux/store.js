import { createStore, combineReducers, applyMiddleware, compose } from 'redux'

import asynchronous_middleware from './middleware/asynchronous middleware'
import preloading_middleware from './middleware/preloading middleware'
import history_middleware from './middleware/history middleware'

export default function create_store(reducer, history, { devtools, server, data, routes, http_client, asynchronous_action_event_naming, on_preload_error, middleware, on_store_created, preload_helpers })
{
	// Redux middlewares
	const middlewares =
	[
		// Asynchronous middleware (e.g. for HTTP Ajax calls).
		asynchronous_middleware(http_client, { asynchronous_action_event_naming }),

		// Makes @preload() decorator work.
		preloading_middleware(server, on_preload_error, preload_helpers, routes, history),

		// Performs `redirect` and `goto` actions on `history`
		history_middleware(history)
	]

	// User may supply his own Redux middleware
	if (middleware)
	{
		middlewares.push(...middleware())
	}

	// Redux "store enhancers"
	const store_enhancers =
	[
		// Redux middlewares are applied in reverse order
		// (which is counter-intuitive)
		applyMiddleware(...middlewares)
	]

	// Add Redux DevTools (if they're enabled)
	if (process.env.NODE_ENV !== 'production' && !server && devtools)
	{
		store_enhancers.push
		(
			// Provides support for DevTools
			window.devToolsExtension ? window.devToolsExtension() : devtools.component.instrument(),
			// Lets you write ?debug_session=<name> in address bar to persist debug sessions
			devtools.persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
		)
	}

	// Create Redux store
	const store = compose(...store_enhancers)(createStore)(combineReducers(reducer), data)

	// On the client side, add `hotReload()` function to the `store`.
	// (could just add this function to `window` but adding it to the `store` fits more)
	if (!server)
	{
		// `hot_reload` helper function gives the web application means to hot reload its Redux reducers
		store.hot_reload = reducer => store.replaceReducer(combineReducers(reducer))
		// Add camelCase alias
		store.hotReload = store.hot_reload
	}

	// Return the Redux store
	return store
}