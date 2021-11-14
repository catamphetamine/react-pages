import React from 'react'

import { getLocationUrl } from '../../location'
import { matchRoutes } from '../../router'
import createRouterElement from '../../router/client/createRouterElement'
import { isServerSidePreloaded } from '../../client/flags'

// Renders the current page React element inside the `to` DOM element.
//
// Returns a `Promise` resolving to `{ store, component }`,
// where `component` is the rendered React component
// and `store` is the Redux store.
//
export default function render({ store })
{
	return matchRoutes(store).then((renderArgs) => {
		// The first pass of initial client-side render
		// was to render the markup which matches server-side one.
		// The second pass will be to render after resolving `getData`.
		if (isServerSidePreloaded()) {
			window._react_pages_initial_prerender = false
			window._react_pages_skip_preload = false
		}

		// `routes` are used when comparing `instantBack` chain items
		// for resetting `instantBack` chain when the same route is encountered twice.
		window._react_pages_route_components = renderArgs.routeIndices

		return {
			element: createRouterElement(renderArgs, store),
			containerProps: { store },
			store
		}
	})
}