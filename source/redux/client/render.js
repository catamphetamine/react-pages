import React from 'react'
import { Router, applyRouterMiddleware } from 'react-router'
import { useScroll } from 'react-router-scroll'

import { location_url } from '../../location'
import { redirect_action } from '../actions'
import match_routes_against_location from '../../react-router/match'

// Renders the current page React element inside the `to` DOM element.
//
// Returns a `Promise` resolving to `{ store, component }`,
// where `component` is the rendered React component
// and `store` is the Redux store.
//
export default async function render({ history, create_page_element, routes, store })
{
	// Performs `react-router` asynchronous match for current location
	// (is required for asynchonous routes to work).
	const { redirect, router_state } = await match_routes_against_location
	({
		// `react-router` `match()` internally uses this `history` to get current location.
		// Could have just used `document.location` here,
		// but what if, for example, `basename` feature of `history` is being used.
		history,
		routes: typeof routes === 'function' ? routes(store) : routes
	})

	// In case of a `react-router` `<Redirect/>`
	if (redirect)
	{
		window.location = location_url(redirect)
		throw new Error(`[react-application] (Not an error) Redirecting to ${location_url(redirect)}`)

		// This kind of a redirect won't work because
		// the `<Router/>` hasn't been rendered yet.
		// return store.dispatch(redirect_action(redirect))
	}

	return {
		element: (
			<Router
				{ ...router_state }
				createElement={ create_route_element }
				history={ history }
				render={ applyRouterMiddleware(useScroll(should_scroll)) }/>
		),
		container_props: { store },
		store
	}
}

// `location` can set `scroll` to `false`
// if it doesn't want scroll position
// being restored on "Back"/"Forward" navigation
// (this is used only in `replaceLocation()`).
function should_scroll(previous_router_properties, new_router_properties)
{
	const { location } = new_router_properties
	return location.scroll !== false
}

// Fixes `react-router` bug by forcing 
// `<Route/>` `component` remount on any URL change.
// https://github.com/ReactTraining/react-router/issues/1982
function create_route_element(component, props)
{
	const { location, routes } = props

	// Is this the last React component in the route components chain
	const is_page_component = component === routes[routes.length - 1].component

	// If it is then remount this page component
	if (is_page_component)
	{
		// Unless explicitly told not to remount
		if (location.remount !== false)
		{
			window._react_router_page_element_key = `${location.pathname}${location.search}`
		}

		// Force `<Route/>` `component` remount on any URL change via `key` property.
		props = { ...props, key: window._react_router_page_element_key }
	}

	// Default behaviour
	return React.createElement(component, props)
}