import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { routerStateReducer } from 'redux-router'
import { createRoutes } from 'react-router/lib/RouteUtils'
import { useBasename } from 'history'

import asynchronous_middleware from './middleware/asynchronous middleware'
import preloading_middleware from './middleware/preloading middleware'
import on_route_update_middleware from './middleware/on route update middleware'

// import use_scroll from 'scroll-behavior'

export default function create_store(reduxReactRouter, createHistory, reducer, { devtools, server, data, routes, http_client, promise_event_naming, on_preload_error, middleware, on_store_created, preload_helpers, on_navigate, history_options })
{
	// Simply using `useScroll` from `scroll-behavior@0.7.0`
	// introduces scroll jumps to top when navigating the app
	// while navigation is asynchronous and takes some time to finish,
	// therefore it creates a scrollbar "jumping" effect.
	//
	// const createHistory = server ? createHistory_server    : () => use_scroll(createHistory_client())
	//
	// Therefore using a middleware to wait for page loading to finish.

	// Generates the three promise event names automatically based on a base event name
	if (!promise_event_naming)
	{
		promise_event_naming = event_name => [`${event_name}: pending`, `${event_name}: done`, `${event_name}: failed`]
	}

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
		asynchronous_middleware(http_client, event => store.dispatch(event), { promise_event_naming }),

		// Enables support for @preload() annotation
		// (which preloads data required for displaying certain pages).
		//
		// Takes effect if the `dispatch`ed message has 
		// { type: ROUTER_DID_CHANGE }
		//
		// In all the other cases it will do nothing.
		//
		// Because `preloading_middleware` is `applied` to the store
		// before `reduxReactRouter` store enhancer adds its own middleware,
		// then it means that standard `dispatch` of `preloading_middleware`
		// won't send actions to that `reduxReactRouter` middleware,
		// therefore using the third argument to hack around this thing.
		//
		preloading_middleware(server, on_preload_error, event => store.dispatch(event), preload_helpers)
	]

	if (on_navigate)
	{
		middlewares.push
		(
			// Implements `react-router` `onUpdate` handler
			//
			// Listens for `{ type: ROUTER_DID_CHANGE }`
			//
			on_route_update_middleware(on_navigate)
		)
	}

	store_enhancers.push
	(
		// `redux-router` middleware
		// (redux-router keeps react-router state in Redux)
		reduxReactRouter
		({
			getRoutes: ({ dispatch, getState }) =>
			{
				function get_state()
				{
					try
					{
						return getState()
					}
					// "TypeError: Cannot read property 'getState' of undefined".
					// This error is thrown when calling `getState()`
					// directly inside `getRoutes()`, before the `store` is created.
					catch (error)
					{
						// Pretend that Redux state is the
						// result of `initialize` function call.
						return data
					}
				}

				return typeof routes === 'function' ? routes({ dispatch, getState: get_state }) : routes;
			},
			createHistory: (...parameters) =>
			{
				return useBasename(createHistory)({ ...parameters, ...history_options })
			}
		}),

		// Ajax and @preload middleware (+ optional others)
		applyMiddleware(...middlewares)
	)

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

	// adds redux-router reducers to the list of all reducers.
	// overall Redux reducer = web application reducers + redux-router reducer
	const overall_reducer = () =>
	{
		const reducers = typeof reducer === 'function' ? reducer() : reducer
		reducers.router = routerStateReducer
		return combineReducers(reducers)
	}

	// create Redux store 
	// with the overall Redux reducer 
	// and the initial Redux store data (aka "the state")
	const store = compose(...store_enhancers)(createStore)(overall_reducer(), data)

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
	
	// // client side hot module reload for Redux reducers attempt
	// // (won't work because it's not an immediate parent module for the reducers)
	// // https://github.com/webpack/webpack/issues/1790
	// if (process.env.NODE_ENV !== 'production' && module.hot)
	// {
	// 	module.hot.accept(reducers_path, () =>
	// 	{
	// 		store.replaceReducer(overall_reducer())
	// 	})
	// }

	// `reload` helper function gives the web application means to hot reload its Redux reducers
	if (on_store_created)
	{
		const reload_reducer = () => store.replaceReducer(overall_reducer())
		
		on_store_created
		({
			reload_reducer,
			reloadReducer: reload_reducer
		})
	}

	// return the created Redux store
	return store
}
