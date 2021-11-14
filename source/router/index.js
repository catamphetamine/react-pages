export { default as foundReducer } from 'found/foundReducer'
export { default as Route } from 'found/Route'
export { default as Redirect } from 'found/Redirect'
export { default as useRouter } from 'found/useRouter'
export { default as RedirectException } from 'found/RedirectException'

import createMatchEnhancer from 'found/createMatchEnhancer'
import Matcher from 'found/Matcher'
import makeRouteConfig from 'found/makeRouteConfig'
import getStoreRenderArgs from 'found/getStoreRenderArgs'
import HttpError from 'found/HttpError'
import resolver from 'found/resolver'
import FoundActionTypes from 'found/ActionTypes'

import Actions from 'farce/Actions'
import ActionTypes from 'farce/ActionTypes'
import createHistoryEnhancer from 'farce/createHistoryEnhancer'
import createBasenameMiddleware from 'farce/createBasenameMiddleware'
import queryMiddleware from 'farce/queryMiddleware'

import { markImmediateNavigationAsInstantBack } from '../redux/client/instantNavigation'

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
			// new Matcher(hotRouteConfig(routes))
			new Matcher(routes)
		)
	]
}

export function matchRoutes(store) {
	return getStoreRenderArgs({
		store,
		resolver,
		matchContext: {
			dispatch: store.dispatch,
			getState: store.getState
		}
	})
	.then((renderArgs) => {
		if (renderArgs.error) {
			throw renderArgs.error
		}
		return renderArgs
	})
}

export function getRoutesByPath(routeIndices, routes) {
	const matchedRoutes = []
	for (const i of routeIndices) {
		matchedRoutes.push(routes[i])
		routes = routes[i].children
	}
	return matchedRoutes
}

export function getMatchedRoutes(state, routes) {
	return getRoutesByPath(state.found.match.routeIndices, routes)
}

export function getMatchedRoutesIndices(state) {
	return state.found.match.routeIndices
}

// A URL can consist of several "routes": a parent route + possible sub-routes.
// "Matched route params" are just this particular route's params for a given URL.
// All routes' params are the combined params for all matched routes for a given URL.
//
// Example:
//
// const routes = [{
//   path: ':foo',
//   children: [{
//     path: ':bar'
//   }]
// }]
//
// const location = {
//   pathname: '/a/b'
// }
//
// const routeParams = [
// 	{ foo: 'a' },
// 	{ bar: 'b' }
// ]
//
// const params = {
//   foo: 'a',
//   bar: 'b'
// }
//
export function getMatchedRoutesParams(state) {
	return state.found.match.routeParams
}

export function getRouteParams(state) {
	const routeIndices = getMatchedRoutesIndices(state)
	return state.found.match.params
}

export function getCurrentlyMatchedLocation(state) {
	return state.found.match.location
}

export function getPreviouslyMatchedLocation(state) {
	return state.found.resolvedMatch &&
		// state.found.resolvedMatch.location.key === undefined &&
		state.found.resolvedMatch.location
}

// Returns a complete route path for matched routes chain.
// E.g. returns "/user/:user_id/post/:post_id"
// for matched URL "/user/1/post/123?key=value".
export function getRoutePath(routes)
{
	return routes
		// Select routes having `path` React property set.
		.filter(route => route.path)
		// Trim leading and trailing slashes (`/`)
		// from each route `path` React property.
		.map(route => route.path.replace(/^\//, '').replace(/\/$/, ''))
		// Join route `path`s with slashes (`/`).
		.join('/') || '/'
}

export function convertRoutes(routes) {
	return makeRouteConfig(routes)
}

export function initializeRouter(store) {
	store.dispatch(Actions.init())
}

export const redirect = Actions.replace

export const goto = (location, options = {}) => {
	markImmediateNavigationAsInstantBack(options.instantBack)
	return Actions.push(location)
}

export const REDIRECT_ACTION_TYPE = ActionTypes.REPLACE
export const GOTO_ACTION_TYPE = ActionTypes.PUSH

export function goBack() {
	return Actions.go(-1)
}

export function goForward() {
	return Actions.go(1)
}

export function pushLocation(location, options) {
	window._react_pages_skip_preload_update_location = true
	return goto(location, options)
}

export function replaceLocation(location) {
	window._react_pages_skip_preload_update_location = true
	return redirect(location)
}

export const UPDATE_MATCH = FoundActionTypes.UPDATE_MATCH
export const RESOLVE_MATCH = FoundActionTypes.RESOLVE_MATCH

export const _RESOLVE_MATCH = '@@react-pages/RESOLVE_MATCH'