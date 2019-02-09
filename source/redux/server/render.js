import React from 'react'

import timer from '../../timer'
import { mergeMeta, getComponentsMeta, getCodeSplitMeta } from '../../meta/meta'
import { matchRoutes, RedirectException } from '../../router'
import { createRouterElement } from '../../router/server'

// Returns a Promise resolving to { status, content, redirect }.
//
export default async function renderOnServer({
	store,
	// routes,
	codeSplit,
	defaultMeta
}) {
	// Routing only takes a couple of milliseconds
	// const routingTimer = timer()

	// Profiling
	const time = {}

	const preloadTimer = timer()

	let renderArgs
	try {
		renderArgs = await matchRoutes(store)
	} catch (error) {
		// Catches redirects from `@preload()`s,
		// redirects from `onError` and from `<Redirect/>` routes.
		if (error instanceof RedirectException) {
			return {
				redirect: error.location
			}
		}
		throw error
	}

	time.preload = preloadTimer()

	// Gather `<title/>` and `<meta/>` tags for this route path
	const { routes, elements } = renderArgs

	// Get `<meta/>` for the route.
	let meta = codeSplit ? getCodeSplitMeta(routes, store.getState()) : getComponentsMeta(elements.map(_ => _.type), store.getState())
	meta = mergeMeta(meta)
	meta = { ...defaultMeta, ...meta }

	// Return HTTP status code and the rendered page
	return {
		// Concatenated `react-router` route string.
		// E.g. "/user/:user_id/post/:post_id"
		route   : getRoutePath(routes),
		status  : getHttpResponseStatusCodeForTheRoute(routes),
		content : createRouterElement(renderArgs),
		meta,
		containerProps : { store },
		time
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