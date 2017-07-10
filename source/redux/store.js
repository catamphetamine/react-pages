import { createStore, combineReducers, applyMiddleware, compose } from 'redux'

import asynchronous_middleware from './middleware/asynchronous middleware'
import preloading_middleware from './middleware/preloading middleware'
import history_middleware from './middleware/history middleware'

import { LoadState } from './actions'

export default function create_store(settings, data, get_history, http_client, options)
{
	const
	{
		reducer,
		routes,
		redux_middleware,
		redux_store_enhancers,
		asynchronous_action_event_naming,
		preload,
		http
	}
	= settings

	const
	{
		server,
		devtools,
		stats,
		on_navigate
	}
	= options

	// Redux middleware
	const middleware = []

	// User may supply his own Redux middleware
	if (redux_middleware)
	{
		middleware.push(...redux_middleware())
	}

	// Built-in middleware
	middleware.push
	(
		// Asynchronous middleware (e.g. for HTTP Ajax calls).
		asynchronous_middleware
		(
			http_client,
			asynchronous_action_event_naming,
			server,
			http.error,
			http.errorState,
			get_history
		),

		// Makes @preload() decorator work.
		preloading_middleware
		(
			server,
			settings.error,
			preload && preload.client,
			preload && preload.helpers,
			routes,
			get_history,
			settings.history.options.basename,
			stats,
			on_navigate
		),

		// Performs `redirect` and `goto` actions on `history`
		history_middleware(get_history)
	)

	// Redux "store enhancers"
	const store_enhancers =
	[
		// Redux middleware are applied in reverse order
		// (which is counter-intuitive)
		applyMiddleware(...middleware)
	]

	// User may supply his own Redux store enhancers
	if (redux_store_enhancers)
	{
		store_enhancers.push(...redux_store_enhancers())
	}

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
	const store = compose(...store_enhancers)(createStore)(create_reducer(reducer), data)

	// On the client side, add `hotReload()` function to the `store`.
	// (could just add this function to `window` but adding it to the `store` fits more)
	if (!server)
	{
		// `hot_reload` helper function gives the web application means to hot reload its Redux reducers
		store.hot_reload = reducer => store.replaceReducer(create_reducer(reducer))
		// Add camelCase alias
		store.hotReload = store.hot_reload
	}

	// Return the Redux store
	return store
}

function create_reducer(reducers)
{
	return replaceable_state(combineReducers(reducers), LoadState)
}

function replaceable_state(reducer, event)
{
	return function(state, action)
	{
		switch (action.type)
		{
			case event:
				return reducer(action.state, action)
			default:
				return reducer(state, action)
		}
	}
}