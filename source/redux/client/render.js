import React from 'react'
import { Router, applyRouterMiddleware } from 'react-router'
import { useScroll } from 'react-router-scroll'

import react_render_on_client from '../../render on client'
import { location_url } from '../../location'
import { redirect_action } from '../actions'
import match_routes_against_location from '../../react-router/match'

// Renders the current page React element inside the `to` DOM element.
//
// Returns a Promise resolving to the rendered React component.
//
export default function render_on_client({ devtools, create_page_element, routes, store, to, on_navigate })
{
	// Performs `react-router` asynchronous match for current location
	// (is required for asynchonous routes to work).
	return match_routes_against_location
	({
		// `store.history` is set in `./store.js`
		history : store.history,
		routes  : typeof routes === 'function' ? routes(store) : routes
	})
	.then(({ redirect, router_state }) =>
	{
		// If a decision to perform a redirect was made 
		// during the routing process,
		// then redirect to another url
		if (redirect)
		{
			return store.dispatch(redirect_action(redirect))
		}

		// No arrow function here,
		// because it will be bound inside `react-router`.
		const onUpdate = function()
		{
			if (on_navigate)
			{
				on_navigate(this.state.location)
			}
		}

		const router_element = <Router
			{ ...router_state }
			onUpdate={ onUpdate }
			history={ store.history }
			render={ applyRouterMiddleware(useScroll()) }/>

		// Wraps <ReduxRouter/> with arbitrary React components (e.g. Redux <Provider/>),
		// loads internationalization messages,
		// and then renders the wrapped React page element to DOM
		return create_page_element(router_element, { store }).then(element =>
		{
			// Render the wrapped React page element to DOM
			const component = react_render_on_client
			({
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
			if (process.env.NODE_ENV === 'production' || !devtools || window.devToolsExtension)
			{
				return result
			}

			// Dev tools should be rendered after initial client render to prevent warning
			// "React attempted to reuse markup in a container but the checksum was invalid"
			// https://github.com/erikras/react-redux-universal-hot-example/pull/210
			//
			// Therefore this function returns an array of two React elements
			// to be rendered sequentially

			// React JSX syntax can't detect lowercase elements
			const DevTools = devtools.component

			// This element will contain React page element and Redux-devtools
			element = 
			(
				<div>
					{ element }
					{/* Since `DevTools` are inserted outside of the `<Provider/>`, provide the `store` manually */}
					<DevTools store={ store }/>
				</div>
			)

			// Render the wrapped React page element to DOM
			result.component = react_render_on_client
			({
				element,     // wrapped React page element
				to,          // DOM element containing React markup
				subsequent_render: true // Prevents "Server-side React render was discarded" warning
			})
			.component

			return result
		})
	})
}