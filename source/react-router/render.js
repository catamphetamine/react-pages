// THIS MODULE IS CURRENTLY NOT USED.
// IT'S JUST HERE AS AN EXAMPLE.

import React          from 'react'
import ReactDOM       from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import { Router, RouterContext } from 'react-router'

// Renders `element` React element inside the `to` DOM element.
//
// returns a Promise resolving to the rendered React component.
//
// The following code hasn't been tested.
// Should theoretically work.
// This is not currently being used.
// It's just an example of Redux-less usage.
//
export function render_on_client({ history, routes, create_page_element })
{
	routes = typeof routes === 'function' ? routes() : routes

	return {
		element: <Router history={ history } routes={ routes }/>
	}
}

// returns a Promise resolving to { status, content, redirect }
//
// export async function render_on_server({ hollow, create_page_element, render, routes, history })
export function render_on_server({ hollow, create_page_element, render, routes, history })
{
	if (hollow)
	{
		// Render the empty <Html/> component into Html markup string
		return {}
	}

	// // perform React-router routing
	// const { redirect, router_state } = await match_routes_against_location
	// ({
	// 	routes: typeof routes === 'function' ? routes() : routes,
	// 	// `react-router` takes the current `location` from `history`
	// 	history
	// })

	// perform React-router routing
	return match_routes_against_location
	({
		routes: typeof routes === 'function' ? routes() : routes,
		// `react-router` takes the current `location` from `history`
		history
	})
	.then(({ redirect, router_state }) => {

	// In case of a `react-router` `<Redirect/>`
	if (redirect)
	{
		return {
			redirect
		}
	}

	// Renders the current page React component to a React element
	const page_element = create_page_element(<Router { ...router_state }/>)

	// Render the current page's React element to HTML markup
	return {
		content : render(page_element)
	}

	//
	})
}