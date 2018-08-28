import React from 'react'

import { getLocationUrl } from '../../location'
import { matchRoutes } from '../../router'
import { createRouterElement } from '../../router/client'

// Renders the current page React element inside the `to` DOM element.
//
// Returns a `Promise` resolving to `{ store, component }`,
// where `component` is the rendered React component
// and `store` is the Redux store.
//
export default function render({ store })
{
	return matchRoutes(store).then(({ redirect, renderArgs }) =>
	{
		// In case of a `react-router` `<Redirect/>`
		if (redirect)
		{
			window.location = getLocationUrl(redirect)
			throw new Error(`[react-website] (Not an error) Redirecting to ${getLocationUrl(redirect)}`)

			// This kind of a redirect won't work because
			// the `<Router/>` hasn't been rendered yet.
			// return store.dispatch(redirect(to))
		}

		// `routes` are used when comparing `instantBack` chain items
		// for resetting `instantBack` chain when the same route is encountered twice.
		window._react_website_route_components = renderArgs.routeIndices

		return {
			element: createRouterElement(renderArgs, store.getState),
			containerProps: { store },
			store
		}
	})
}