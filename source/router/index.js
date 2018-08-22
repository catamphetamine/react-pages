export { default as foundReducer } from 'found/lib/foundReducer'
export { default as Route } from 'found/lib/Route'
export { default as Redirect } from 'found/lib/Redirect'
export { default as withRouter } from 'found/lib/withRouter'

import createMatchEnhancer from 'found/lib/createMatchEnhancer'
import Matcher from 'found/lib/Matcher'
import makeRouteConfig from 'found/lib/makeRouteConfig'

import getStoreRenderArgs from 'found/lib/getStoreRenderArgs'
import RedirectException from 'found/lib/RedirectException'
import resolver from 'found/lib/resolver'

import Actions from 'farce/lib/Actions'
import ActionTypes from 'farce/lib/ActionTypes'
import createHistoryEnhancer from 'farce/lib/createHistoryEnhancer'
import createBasenameMiddleware from 'farce/lib/createBasenameMiddleware'
import queryMiddleware from 'farce/lib/queryMiddleware'

export function createRouterStoreEnhancers(routes, createHistoryProtocol, options = {}) {
	const middlewares = [
		queryMiddleware
	]
	if (options.basename) {
		middlewares.push(createBasenameMiddleware({
			basename: options.basename
		}))
	}
	return [
		createHistoryEnhancer({
			protocol: createHistoryProtocol(),
			middlewares
		}),
		createMatchEnhancer(
			// new Matcher(hotRouteConfig(routes), { matchStemRoutes: false })
			new Matcher(routes, { matchStemRoutes: false })
		)
	]
}

export function matchRoutes(store) {
	return getStoreRenderArgs({
		store,
		resolver
	})
	.then(
		(renderArgs) => {
			if (renderArgs.error) {
				throw renderArgs.error
			}
			return {
				renderArgs
			}
		},
		(error) => {
			if (error instanceof RedirectException) {
				return {
					redirect: store.farce.createHref(error.location)
				}
			}
			throw error
		}
	)
}

export function getMatchedRoutes(state, routes)
{
	const matchedRoutes = []
	for (const i of state.found.match.routeIndices) {
		matchedRoutes.push(routes[i])
		routes = routes[i].children
	}
	return matchedRoutes
}

export function getMatchedRoutesParams(state) {
	return state.found.match.routeParams
}

export function getCurrentlyMatchedLocation(state) {
	return state.found.match.location
}

export function getPreviouslyMatchedLocation(state) {
	return state.found.resolvedMatch &&
		// state.found.resolvedMatch.location.key === undefined &&
		state.found.resolvedMatch.location
}

// Returns a complete route path
// for matched `<Route/>`s chain.
// E.g. returns "/user/:user_id/post/:post_id"
// for matched URL "/user/1/post/123?key=value".
export function getRoutePath(routes)
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

export function getRouteParams(state) {
	return state.found.params
}

export function convertRoutes(routes) {
	return makeRouteConfig(routes)
}

export function initializeRouter(store) {
	store.dispatch(Actions.init())
}

export const redirect = Actions.replace
export const goto = Actions.push

export const REDIRECT_ACTION_TYPE = ActionTypes.REPLACE
export const GOTO_ACTION_TYPE = ActionTypes.PUSH

export function goBack() {
	return Actions.go(-1)
}

export function pushLocation(location) {
	skipPreload()
	return goto(location)
}

export function replaceLocation(location) {
	skipPreload()
	return redirect(location)
}

function skipPreload() {
	if (typeof window !== 'undefined') {
		window._react_website_skip_preload = true
		setTimeout(() => window._react_website_skip_preload = false)
	}
}