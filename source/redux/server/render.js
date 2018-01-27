import React from 'react'
import { Router } from 'react-router'

import { location_url } from '../../location'
import { get_location } from '../../history'
import timer from '../../timer'
import { start_preload } from '../preload/actions'
import match_routes_against_location, { get_route_path } from '../../react-router/match'
import { get_meta } from '../../meta'

// Returns a Promise resolving to { status, content, redirect }.
//
export default async function render_on_server({ history, hollow, create_page_element, render, store, routes })
{
	// Routing only takes a couple of milliseconds
	// const routing_timer = timer()

	// Perform routing for this URL
	try
	{
		const { redirect, router_state } = await match_routes_against_location
		({
			history,
			routes
		})

		// routing_timer()

		// In case of a `react-router` `<Redirect/>`
		if (redirect)
		{
			return {
				redirect
			}
		}

		// Profiling
		const time = {}

		const preload_timer = timer()

		// After the page has finished preloading, render it
		await store.dispatch(start_preload(get_location(history)))
	
		time.preload = preload_timer()

		// Gather `<title/>` and `<meta/>` tags for this route path
		const { components, location, params } = router_state
		const meta = get_meta(components, location, params, store.getState())

		let page_element
		if (!hollow)
		{
			// Render the current page React component to a React element.
			// Passing `store` as part of `props` to the `container`.
			page_element = create_page_element(<Router { ...router_state }/>, { store })
		}

		// Return HTTP status code and the rendered page
		return {
			// Concatenated `react-router` route string.
			// E.g. "/user/:user_id/post/:post_id"
			route   : get_route_path(router_state),
			status  : get_http_response_status_code_for_the_route(router_state.routes),
			content : render(page_element, meta),
			time
		}
	}
	catch (error)
	{
		// If an HTTP redirect is required, then abort all further actions.
		// That's a hacky way to implement redirects but it seems to work.
		if (error._redirect)
		{
			return {
				redirect: error._redirect
			}
		}

		// Otherwise, throw this error up the call stack.
		throw error
	}
}

// One can set a `status` prop for a react-router `Route`
// to be returned as an Http response status code (404, etc)
function get_http_response_status_code_for_the_route(matched_routes)
{
	return matched_routes.reduce((previous, current) => (current && current.status) || (previous && current.status))
}