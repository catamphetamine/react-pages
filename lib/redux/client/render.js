import React from 'react'

import { matchRoutes } from '../../router/index.js'
import createRouterElement from '../../router/client/createRouterElement.js'
import { isServerSidePreloaded } from '../../client/flags.js'

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
		// The second pass is about rendering after resolving `getData`.
		if (isServerSidePreloaded()) {
			window._ReactPages_Page_ServerSideRenderedPageRestorationPrerender = false
			window._ReactPages_Page_SkipDataLoad = false
		}

		// // `routes` are used when comparing `instantBack` chain items
		// // for resetting `instantBack` chain when the same route is encountered twice.
		// window._ReactPages_Page_RouteComponents = renderArgs.routeIndices

		return {
			element: createRouterElement(renderArgs, store),
			containerProps: { store },
			store
		}
	})
}