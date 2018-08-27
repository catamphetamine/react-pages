import React from 'react'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction'

import asynchronousMiddleware from './middleware/asynchronous'

import preload from './preload/preload'
import preloadReducer from './preload/reducer'

import {
	convertRoutes,
	foundReducer,
	createRouterStoreEnhancers,
	initializeRouter,
	getMatchedRoutes,
	getMatchedRoutesParams,
	getRouteParams,
	getCurrentlyMatchedLocation,
	getPreviouslyMatchedLocation,
	// setUpNavigationHook
} from '../router'

export default function _createStore(settings, data, createHistoryProtocol, httpClient, options)
{
	let
	{
		reducers,
		routes,
		reduxMiddleware,
		reduxStoreEnhancers,
		reduxEventNaming,
		http,
		onError
	}
	= settings

	const
	{
		server,
		devtools,
		stats,
		onNavigate
	}
	= options

	// `routes` will be converted.
	let convertedRoutes
	const getRoutes = () => convertedRoutes

	// Add `@preload()` data hook.
	routes = React.cloneElement(routes, {
		getData() {
			let isInitialClientSideNavigation
			if (!server) {
				if (!window._react_website_routes_rendered) {
					isInitialClientSideNavigation = true
					window._react_website_routes_rendered = true
				}
				if (window._react_website_skip_preload) {
					return Promise.resolve()
				}
			}

			return preload(
				getCurrentlyMatchedLocation(store.getState()),
				// `previousLocation` is the location before the transition.
				// Is used for `instantBack`.
				(server || isInitialClientSideNavigation) ? undefined : getPreviouslyMatchedLocation(store.getState()),
				{
					routes: getMatchedRoutes(store.getState(), getRoutes()),
					routeParams: getMatchedRoutesParams(store.getState()),
					params: getRouteParams(store.getState())
				},
				server,
				onError,
				store.dispatch,
				store.getState,
				stats,
				onNavigate
			)
		}
	})

	// Convert `found` `<Route/>`s to a JSON structure.
	routes = convertRoutes(routes)
	convertedRoutes = routes

	// Redux middleware.
	// User may supply his own Redux middleware.
	const middleware = reduxMiddleware ? reduxMiddleware() : []

	// Built-in middleware.
	middleware.push
	(
		// Asynchronous middleware (e.g. for HTTP Ajax calls).
		asynchronousMiddleware
		(
			httpClient,
			reduxEventNaming,
			server,
			http.onError,
			http.errorState
		)
	)

	// Redux "store enhancers"
	const storeEnhancers =
	[
		// Redux middleware are applied in reverse order.
		// (which is counter-intuitive)
		applyMiddleware(...middleware)
	]

	// User may supply his own Redux store enhancers.
	if (reduxStoreEnhancers) {
		storeEnhancers.push(...reduxStoreEnhancers())
	}

	storeEnhancers.push(...createRouterStoreEnhancers(routes, createHistoryProtocol, {
		basename: settings.basename
	}))

	// Create Redux store.
	const store = getStoreEnhancersComposer(server, devtools)(...storeEnhancers)(createStore)(createReducer(reducers), data)

	// On the client side, add `hotReload()` function to the `store`.
	// (could just add this function to `window` but adding it to the `store` fits more)
	if (!server) {
		// `hotReload` helper function gives the web application means to hot reload its Redux reducers
		store.hotReload = (reducers) => store.replaceReducer(createReducer(reducers))
	}

	// Initialize `found`.
	initializeRouter(store)

	// Return the Redux store
	return store
}

function createReducer(reducers)
{
	// Check for reserved reducer names.
	for (const reducerName of RESERVED_REDUCER_NAMES) {
		if (reducers[reducerName]) {
			throw new Error(`"${reducerName}" reducer name is reserved.`)
		}
	}
	// Clone the object because it will be modified.
	reducers = { ...reducers }
	// Add `found` reducer.
	reducers.found = foundReducer
	// Add `@preload()` status reducer.
	reducers.preload = preloadReducer
	// Create reducer.
	return combineReducers(reducers)
}

function getStoreEnhancersComposer(server, devtools)
{
	// Redux DevTools aren't used on the server side
	if (server) {
		return compose
	}

	// Custom behaviour
	if (devtools && devtools.compose) {
		return devtools.compose
	}

	// With custom options
	if (devtools && devtools.options) {
		return composeWithDevTools(devtools.options)
	}

	// Without custom options
	return composeWithDevTools
}

const RESERVED_REDUCER_NAMES = [
	'found',
	'location',
	'preload'
]