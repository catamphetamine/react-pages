// THIS MODULE IS CURRENTLY NOT USED.
// IT'S JUST HERE AS AN EXAMPLE.

import React          from 'react'
import ReactDOM       from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import { Router, RouterContext, browserHistory } from 'react-router'

import react_render_on_client from '../render on client'
import react_render_on_server from '../render on server'
import { location_url } from '../location'

// Renders `element` React element inside the `to` DOM element.
//
// returns a Promise resolving to the rendered React component.
//
// The following code hasn't been tested.
// Should theoretically work.
// This is not currently being used.
// It's just an example of Redux-less usage.
//
export function render_on_client({ routes, create_page_element, to })
{
	const router_element = <Router history={browserHistory} routes={ typeof routes === 'function' ? routes() : routes }/>

	return create_page_element(router_element).then(element =>
	{
		// render the wrapped React page element to DOM
		return react_render_on_client
		({
			element,     // wrapped React page element
			to           // DOM element containing React markup
		})
	})
}

// returns a Promise resolving to { status, content, redirect }
//
export function render_on_server({ disable_server_side_rendering, create_page_element, render_webpage_as_react_element, routes, url })
{
	// Maybe no one really needs to `disable_server_side_rendering`
	if (disable_server_side_rendering)
	{
		// Render the empty <Html/> component into Html markup string
		return Promise.resolve({ content: react_render_on_server({ render_webpage_as_react_element }) })
	}

	// perform React-router routing
	return match_routes_against_location({ routes: typeof routes === 'function' ? routes() : routes, location: url })
	.then(({ redirect, router_state }) =>
	{
		if (redirect)
		{
			return { redirect: location_url(redirect) }
		}

		// Renders the current page React component to a React element
		const page_element = create_page_element(<RouterContext { ...router_state }/>)

		// Render the current page's React element to HTML markup
		const content = react_render_on_server({ render_webpage_as_react_element, page_element })

		// return HTTP status code and HTML markup
		return { content }
	})
}