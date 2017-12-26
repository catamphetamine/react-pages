import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction'

import asynchronous_middleware from './middleware/asynchronous'
import history_middleware from './middleware/history'

import preloading_middleware from './preload/middleware'
import preload_reducer from './preload/reducer'

import { LoadState } from './actions'

export default function create_store(settings, data, get_history, http_client, options)
{
	const
	{
		reducer,
		routes,
		redux_middleware,
		redux_store_enhancers,
		redux_event_naming,
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
			redux_event_naming,
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

	// Check that `@preload()` status reducer name isn't occupied
	if (reducer.preload)
	{
		throw new Error(`"preload" reducer name is reserved for react-website's "@preload()" status. Use a different name for your "preload" reducer.`)
	}

	// Create Redux store
	const store = get_store_enhancers_composer(server, devtools)(...store_enhancers)(createStore)(create_reducer(reducer), data)

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
	// Add `@preload()` status reducer
	reducers.preload = preload_reducer
	// Create reducer
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

function get_store_enhancers_composer(server, devtools)
{
	// Redux DevTools aren't used on the server side
	if (server)
	{
		return compose
	}

	// Custom behaviour
	if (devtools && devtools.compose)
	{
		return devtools.compose
	}

	// With custom options
	if (devtools && devtools.options)
	{
		return composeWithDevTools(devtools.options)
	}

	// Without custom options
	return composeWithDevTools
}