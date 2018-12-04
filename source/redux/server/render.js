import React from 'react'

import timer from '../../timer'
import { mergeMeta, getComponentsMeta, getCodeSplitMeta } from '../../meta/meta'
import { matchRoutes } from '../../router'
import { createRouterElement } from '../../router/server'

// Returns a Promise resolving to { status, content, redirect }.
//
export default async function renderOnServer({
	store,
	routes,
	codeSplit
}) {
	// Routing only takes a couple of milliseconds
	// const routingTimer = timer()

	// Perform routing for this URL
	try {
		// Profiling
		const time = {}

		const preloadTimer = timer()

		const { redirect, renderArgs } = await matchRoutes(store)

		// routingTimer()

		// In case of a routing redirect.
		if (redirect) {
			return {
				redirect
			}
		}

		time.preload = preloadTimer()

		// Gather `<title/>` and `<meta/>` tags for this route path
		const { routes, elements } = renderArgs

		// Return HTTP status code and the rendered page
		return {
			// Concatenated `react-router` route string.
			// E.g. "/user/:user_id/post/:post_id"
			route   : getRoutePath(routes),
			status  : getHttpResponseStatusCodeForTheRoute(routes),
			content : createRouterElement(renderArgs),
			meta    : mergeMeta(codeSplit ? getCodeSplitMeta(routes, store.getState()) : getComponentsMeta(elements.map(_ => _.type), store.getState())),
			containerProps : { store },
			time
		}
	} catch (error) {
		// If an HTTP redirect is required, then abort all further actions.
		// That's a hacky way to implement redirects but it seems to work.
		if (error._redirect) {
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
function getHttpResponseStatusCodeForTheRoute(matchedRoutes)
{
	return matchedRoutes.reduce((previous, current) => (current && current.status) || (previous && current.status), null)
}

// Returns a complete path
// for matched `react-router` `<Route/>` chain.
// E.g. returns "/user/:user_id/post/:post_id"
// for matched URL "/user/1/post/123?key=value".
function getRoutePath(routes)
{
	return routes
		// Select `<Route/>`s having `path` React property set.
		.filter(route => route.path)
		// Trim leading and trailing slashes (`/`)
		// from each `<Route/>` `path` React property.
		.map(route => route.path.replace(/^\//, '').replace(/\/$/, ''))
		// Join `<Route/>` `path`s with slashes (`/`).
		.join('/') || '/'
}