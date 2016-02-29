import { client as default_client_render, server as default_server_render } from '../render'

import { match } from 'redux-router/server'
import { ReduxRouter } from 'redux-router'

import React          from 'react'
import ReactDOMServer from 'react-dom/server'

// renders directly to the "to" DOM element.
//
// returns a Promise resolving to the rendered React component
//
export function client({ development, create_page_element, create_routes, store, to })
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
	//
	const router_element = <ReduxRouter routes={create_routes({store})}/>

	// wraps <ReduxRouter/> with arbitrary React components (e.g. Redux <Provider/>),
	// loads internationalization messages,
	// and then renders the wrapped React page element to DOM
	return create_page_element(router_element, {store}).then(element =>
	{
		// render the wrapped React page element to DOM
		return default_client_render
		({
			development, // development mode flag
			element,     // wrapped React page element
			to           // DOM element containing React markup
		})
	})
}

// returns a Promise resolving to { status, markup, redirect_to }.
//
export function server({ disable_server_side_rendering, create_page_element, render_html, url, store })
{
	// I guess no one actually disabled their server side rendering
	// so this if condition may be removed (along with the flag) in the future
	if (disable_server_side_rendering)
	{
		// render the empty <Html/> component into Html markup string
		return default_server_render({ render_html })
	}

	// return a Promise
	//
	// (not using `promisify()` helper here 
	//  to avoid introducing dependency on `bluebird` Promise library)
	//
	return new Promise((resolve, reject) =>
	{
		// perform routing for this `url`
		store.dispatch(match(url, (error, redirect_location, router_state) =>
		{
			// if a decision to perform a redirect was made 
			// during the routing process,
			// then redirect to another url
			if (redirect_location)
			{
				return resolve
				({
					redirect_to: redirect_location.pathname + redirect_location.search
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

			// one can set a `status` prop for a react-router `Route`
			// to be returned as an Http response status code (404, etc)
			const get_http_response_status_code_for_the_chosen_route = matched_routes =>
			{
				return matched_routes.reduce((previous, current) => (current && current.status) || (previous && current.status))
			}

			// routing process succeeded.
			// render the page's React component.
			
			// this promise was previously set by "preloading middleware"
			// if there were any @preload() calls on the current route components
			let promise = store.getState().router

			// if nothing is being preloaded, create a dummy Promise
			if (!promise || typeof promise.then !== 'function')
			{
				promise = Promise.resolve()
			}

			// after everything is preloaded, render the page
			promise.then(() => 
			{
				// Http response status code
				const status = get_http_response_status_code_for_the_chosen_route(router_state.routes)

				// React page content element
				const page_element = create_page_element(<ReduxRouter/>, {store})

				// render the page's React component
				default_server_render({ render_html, page_element }).then
				(
					result => resolve({ status, markup: result.markup }),
					reject
				)
			})
			.catch(error =>
			{
				reject(error)
			})
		}))
	})
}