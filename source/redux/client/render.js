import React from 'react'
import { ReduxRouter, replace } from 'redux-router'
import { RouterContext, applyRouterMiddleware, match } from 'react-router'
import use_scroll from 'react-router-scroll'

import react_render_on_client from '../../render on client'

import { location_url } from '../../location'

// Renders the current page React element inside the `to` DOM element.
//
// Returns a Promise resolving to the rendered React component.
//
export default function render_on_client({ development, development_tools, create_page_element, create_routes, store, to })
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

	// (`store.history` and `store.transitionManager` are set by `redux-router`)

	return match_react_router({ history: store.history, routes: create_routes(store), transition_manager: store.transitionManager })
		.then(({ redirect, router_props }) =>
		{
			// If a decision to perform a redirect was made 
			// during the routing process,
			// then redirect to another url
			if (redirect)
			{
				store.dispatch(replace(location_url(redirect)))
				return
			}

			const router_element = <ReduxRouter {...router_props} RoutingContext={applyRouterMiddleware(use_scroll())}/>

			// Wraps <ReduxRouter/> with arbitrary React components (e.g. Redux <Provider/>),
			// loads internationalization messages,
			// and then renders the wrapped React page element to DOM
			return create_page_element(router_element, { store }).then(element =>
			{
				// Render the wrapped React page element to DOM
				const component = react_render_on_client
				({
					development, // development mode flag
					element,     // wrapped React page element
					to           // DOM element containing React markup
				})
				.component

				const result =
				{
					component,
					store
				}

				// If Redux-devtools aren't enabled, then just return the Page element
				// (if Redux-devtools are installed as a web browser extension
				//  then no need to do the second render too)
				if (!development || !development_tools || window.devToolsExtension)
				{
					return result
				}

				// Dev tools should be rendered after initial client render to prevent warning
				// "React attempted to reuse markup in a container but the checksum was invalid"
				// https://github.com/erikras/react-redux-universal-hot-example/pull/210
				//
				// Therefore this function returns an array of two React elements
				// to be rendered sequentially

				// console.log(`You're gonna see two "@@reduxReactRouter/initRoutes" events in Redux DevTools because the page has been rendered twice: first time without DevTools and second time with it`)

				// React JSX syntax can't detect lowercase elements
				const DevTools = development_tools

				// This element will contain React page element and Redux-devtools
				element = 
				(
					<div>
						{element}
						{/* Since `DevTools` are inserted outside of the `<Provider/>`, provide the `store` manually */}
						<DevTools store={store}/>
					</div>
				)

				// Render the wrapped React page element to DOM
				result.component = react_render_on_client
				({
					development, // development mode flag
					element,     // wrapped React page element
					to,          // DOM element containing React markup
					subsequent_render: true // Prevents "Server-side React render was discarded" warning
				})
				.component

				return result
			})
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