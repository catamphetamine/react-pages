import React from 'react'
import { Router } from 'react-router'

import { location_url } from '../../location'
import { get_location } from '../../history'
import timer from '../../timer'
import { preload_action } from '../actions'
import match_routes_against_location from '../../react-router/match'
import get_route_path from '../../react-router/get route path'
import { get_meta } from '../../meta'

function timed_react_render_on_server(streaming, render_webpage, meta, page_element)
{
	if (streaming)
	{
		return {
			content : render_webpage(page_element, meta)
		}
	}

	const render_timer = timer()
	const html = render_webpage(page_element, meta)

	return {
		content : html,
		time    : render_timer()
	}
}

// Returns a Promise resolving to { status, content, redirect }.
//
export default function render_on_server({ history, disable_server_side_rendering, streaming, create_page_element, render_webpage, store, routes, before_render })
{
	// Routing only takes a couple of milliseconds
	// const routing_timer = timer()

	// Perform routing for this URL
	return match_routes_against_location
	({
		history,
		routes
	})
	.then(({ redirect, router_state }) =>
	{
		// routing_timer()

		// In case of a `react-router` `<Redirect/>`
		if (redirect)
		{
			return { redirect }
		}

		// Http response status code
		const http_status_code = get_http_response_status_code_for_the_route(router_state.routes)

		// Concatenated `react-router` route string.
		// E.g. "/user/:user_id/post/:post_id"
		const route = get_route_path(router_state)

		// Profiling
		const time = {}

		const preload_timer = timer()

		// After the page has finished preloading, render it
		return store.dispatch(preload_action(get_location(history))).then(() =>
		{
			time.preload = preload_timer()

			if (before_render)
			{
				return before_render(store)
			}
		})
		.then(() =>
		{
			// Gather `<title/>` and `<meta/>` tags for this route path
			const { components, location, params } = router_state
			const meta = get_meta(components, location, params, store.getState())

			if (disable_server_side_rendering)
			{
				// Render the empty <Html/> component into Html markup string
				const rendered = timed_react_render_on_server(streaming, render_webpage, meta)
				time.render = rendered.time

				// return  HTML markup
				return { content: rendered.content, route, time }
			}

			// Renders the current page React component to a React element.
			// Passing `store` as part of `props` to the `wrapper`.
			const page_element = create_page_element(<Router { ...router_state }/>, { store })

			// Render the current page's React element to HTML markup
			const rendered = timed_react_render_on_server(streaming, render_webpage, meta, page_element)

			// Rendering a complex React page (having more than 1000 components)
			// takes about 100ms (`time.render`).
			// This is quite slow but that's how React Server Side Rendering currently is.
			time.render = rendered.time

			// return HTTP status code and HTML markup
			return { status: http_status_code, meta, content: rendered.content, route, time }
		})
	})
	.catch((error) =>
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
}

// One can set a `status` prop for a react-router `Route`
// to be returned as an Http response status code (404, etc)
function get_http_response_status_code_for_the_route(matched_routes)
{
	return matched_routes.reduce((previous, current) => (current && current.status) || (previous && current.status))
}