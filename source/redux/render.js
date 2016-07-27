import React          from 'react'
import ReactDOMServer from 'react-dom/server'

import { match as redux_router_server_match } from 'redux-router/server'
import { ReduxRouter, replace } from 'redux-router'
import { createRouterObject, createRoutingHistory } from 'react-router/lib/RouterUtils'
import { RouterContext, applyRouterMiddleware, match } from 'react-router'
import use_scroll      from 'react-router-scroll'

import { render_on_client as react_render_on_client, render_on_server as react_render_on_server } from '../render'

import DevTools from './dev tools'

// Renders the current page React element inside the `to` DOM element.
//
// returns a Promise resolving to the rendered React component.
//
export function render_on_client({ development, development_tools, create_page_element, create_routes, store, to })
{
	// In short, Redux-router performs react-router routing asynchronously
	// which allows preloading pages before showing them.
	//
	// Explanation:
	//
	// Redux-router's <ReduxRouter/> React component
	// wraps React-router's <RoutingContext/>,
	// which provides render()ing pages but doesn't do Url matching.
	//
	// Also Redux-router creates a special history listener
	// which does match a Url to a corresponding react-router route
	// (React-router's useRoutes() helper function)
	// https://github.com/rackt/react-router/blob/1fb4f7abb9a7f32a82fb3bc15ace7012fead7885/modules/useRoutes.js#L6-L16
	//
	// Now, when user clicks a React-router hyperlink,
	// history is updated with `pushState` event,
	// then it performs React-router route matching for this new Url,
	// gives this new React-router route info to Redux-router
	// which emits 'ROUTER_DID_CHANGE' Redux event.
	//
	// When @preload() helper middleware detects such a 'ROUTER_DID_CHANGE' event
	// it pauses further propagation of this event,
	// @preload()s all the <Route/> React components in the new React-router route chain
	// and then, when all the @preload()ing Promises are resolved,
	// it allows further propagation of that paused 'ROUTER_DID_CHANGE' event,
	// which eventually reaches the final Redux-router middleware
	// which listens for this 'ROUTER_DID_CHANGE' event too
	// and upon detecting it this last middleware writes the new Url to Redux store
	// triggering a render() method call for the root <ReduxRouter/> React component
	// (see the beginning of this explanation) and the new page is finally rendered.
	
	return match_react_router({ history: store.history, routes: create_routes({ store }), transition_manager: store.transitionManager })
		.then(({ redirect, router_props }) =>
		{
			// if a decision to perform a redirect was made 
			// during the routing process,
			// then redirect to another url
			if (redirect)
			{
				store.dispatch(replace(redirect.pathname + redirect.search))
				return
			}

			console.log('You are gonna see a React warning in the console: "Failed prop type: Invalid prop `RoutingContext` supplied to `ReduxRouterContext`, expected a single ReactElement".\nThis warning is not an error and will be fixed in `redux-router`:\nhttps://github.com/acdlite/redux-router/issues/266')
	
			const router_element = <ReduxRouter {...router_props} RoutingContext={applyRouterMiddleware(use_scroll())}/>
			// const router_element = <ReduxRouter routes={create_routes({ store })} RoutingContext={applyRouterMiddleware(use_scroll())}/>

			// wraps <ReduxRouter/> with arbitrary React components (e.g. Redux <Provider/>),
			// loads internationalization messages,
			// and then renders the wrapped React page element to DOM
			return create_page_element(router_element, { store }).then(element =>
			{
				// render the wrapped React page element to DOM
				const component = react_render_on_client
				({
					development, // development mode flag
					element,     // wrapped React page element
					to           // DOM element containing React markup
				})

				const result =
				{
					component,
					store
				}

				// if Redux-devtools aren't enabled, then just return the Page elemnt
				if (!development || !development_tools)
				{
					return result
				}

				// Dev tools should be rendered after initial client render to prevent warning
				// "React attempted to reuse markup in a container but the checksum was invalid"
				// https://github.com/erikras/react-redux-universal-hot-example/pull/210
				//
				// Therefore this function returns an array of two React elements
				// to be rendered sequentially

				// console.log(`You are gonna see a warning about "React.findDOMNode is deprecated" in the console. It's normal: redux_devtools hasn't been updated to React 0.14 yet`)

				// this element will contain React page element and Redux-devtools
				element = 
				(
					<div>
						{element}
						{/* Since `DevTools` are inserted outside of the `<Provider/>`, provide the `store` manually */}
						<DevTools store={store}/>
					</div>
				)

				// render the wrapped React page element to DOM
				result.component = react_render_on_client
				({
					development, // development mode flag
					element,     // wrapped React page element
					to,          // DOM element containing React markup
					subsequent_render: true // Prevents "Server-side React render was discarded" warning
				})

				return result
			})
		})
}

// returns a Promise resolving to { status, content, redirect }.
//
export function render_on_server({ disable_server_side_rendering, create_page_element, render_webpage_as_react_element, url, store })
{
	// Maybe no one really needs to `disable_server_side_rendering`
	if (disable_server_side_rendering)
	{
		// Render the empty <Html/> component into Html markup string
		return Promise.resolve({ content: react_render_on_server({ render_webpage_as_react_element }) })
	}

	// Perform routing for this `url`
	return match_url(url, store).then(routing_result =>
	{
		// Return in case of an HTTP redirect
		if (routing_result.redirect)
		{
			return routing_result
		}

		// Http response status code
		const http_status_code = get_http_response_status_code_for_the_route(routing_result.matched_routes)

		// When `url` matching process finished,
		// it immediately launched preloading process,
		// so it's preloading the page now.
		//
		// After the page has finished preloading, render it
		//
		return wait_for_page_to_preload(store).then(() => 
		{
			// Renders the current page React component to a React element
			// (`<ReduxRouter/>` is gonna get the matched route from the `store`)
			const page_element = create_page_element(<ReduxRouter/>, { store })

			// Render the current page's React element to HTML markup
			const content = react_render_on_server({ render_webpage_as_react_element, page_element })

			// return HTTP status code and HTML markup
			return { status: http_status_code, content }
		},
		(error) =>
		{
			// If an HTTP redirect is required, then abort all further actions.
			// That's a hacky way to implement redirects but it seems to work.
			if (error._redirect)
			{
				return { redirect: error._redirect }
			}

			// Otherwise, throw this error up the call stack.
			throw error
		})
	})
}

// Waits for all `@preload()` calls to finish.
function wait_for_page_to_preload(store)
{
	// This promise was previously set by "preloading middleware"
	// if there were any @preload() calls on the current route components
	const promise = store.getState().router

	// Validate the currently preloading promise
	if (promise && typeof promise.then === 'function')
	{
		// If it's really a Promise then return it
		return promise
	}

	// Otherwise, if nothing is being preloaded, just return a dummy Promise
	return Promise.resolve()
}

// One can set a `status` prop for a react-router `Route`
// to be returned as an Http response status code (404, etc)
function get_http_response_status_code_for_the_route(matched_routes)
{
	return matched_routes.reduce((previous, current) => (current && current.status) || (previous && current.status))
}

// Matches a `url` to a route
// (to a hierarchy of React-router `<Route/>`s).
//
// Returns a Promise resolving to an object:
//
//   redirect    - in case of an HTTP redirect
//
//   matched_routes - the matched hierarchy of React-router `<Route/>`s
//
function match_url(url, store)
{
	// (not using `promisify()` helper here 
	//  to avoid introducing dependency on `bluebird` Promise library)
	//
	return new Promise((resolve, reject) =>
	{
		// perform routing for this `url`
		store.dispatch(redux_router_server_match(url, (error, redirect_location, router_state) =>
		{
			// if a decision to perform a redirect was made 
			// during the routing process,
			// then redirect to another url
			if (redirect_location)
			{
				return resolve
				({
					redirect: redirect_location.pathname + redirect_location.search
				})
			}

			// routing process failed
			if (error)
			{
				return reject(error)
			}

			// don't know what this if condition is for
			if (!router_state)
			{
				return reject(new Error('No router state'))
			}

			return resolve({ matched_routes: router_state.routes })
		}))
	})
}

// Performs `react-router` asynchronous match for current location
// (is required for asynchonous routes to work).
//
// Rewriting the default `react-router` `match` function
// to use the supplied `transitionManager` instead of creating a new one.
// https://github.com/reactjs/react-router/blob/master/modules/match.js
//
function match_react_router({ history, routes, transition_manager })
{
	return new Promise((resolve, reject) =>
	{
		// Get `location` from `history`
		let location
		const unlisten = history.listen(historyLocation => location = historyLocation)

		// Match `location` to a route (`<Route/>`s)
		transition_manager.match(location, (error, redirect_location, next_router_state) =>
		{
			if (error)
			{
				return reject(error)
			}

			if (redirect_location)
			{
				return resolve({ redirect: redirect_location })
			}

			resolve({ router_props: next_router_state })

			// Defer removing the listener to here to prevent DOM histories from having
			// to unwind DOM event listeners unnecessarily, in case callback renders a
			// <Router> and attaches another history listener.
			unlisten()
		})

		// match({ history, routes }, (error, redirect_location, router_props) =>
		// {
		// 	if (error)
		// 	{
		// 		return reject(error)
		// 	}
		//
		// 	if (redirect_location)
		// 	{
		// 		return resolve({ redirect: redirect_location })
		// 	}
		//
		// 	return resolve({ router_props })
		// })
	})
}