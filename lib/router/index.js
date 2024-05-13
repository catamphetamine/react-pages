// `@catamphetamine/found` is a fork of `found` with some changes:
// * `redux` and `react-redux` are `peerDependencies` instead of `dependencies`.
// * `farce` was replaced with `@catamphetamine/farce`.
// * Fixed a bug when `found` ignores all navigation actions until its `componentDidMount()` is called.
export {
	foundReducer,
	Redirect,
	useRouter,
	RedirectException
} from '@catamphetamine/found'

// `@catamphetamine/found` is a fork of `found` with some changes:
// * `redux` and `react-redux` are `peerDependencies` instead of `dependencies`.
// * `farce` was replaced with `@catamphetamine/farce` (added `location.origin`)
import {
	createMatchEnhancer,
	Matcher,
	getStoreRenderArgs,
	HttpError,
	resolver
} from '@catamphetamine/found'

import {
	createHistoryEnhancer,
	createBasenameMiddleware,
	queryMiddleware
} from '@catamphetamine/farce'

export function createRouterStoreEnhancers(routes, createHistoryProtocol, options = {}) {
	const middlewares = [
		// Parses `location.search` string into `location.query` object.
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

export function getMatch(state) {
	return state.found.match
}

export function getMatchedRoutes(state, routes) {
	return getRoutesByPath(getMatch(state).routeIndices, routes)
}

export function getMatchedRoutesIndices(state) {
	return getMatch(state).routeIndices
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
	return getMatch(state).routeParams
}

export function getRouteParams(state) {
	return getMatch(state).params
}

export function getMatchedLocation(state) {
	return getMatch(state).location
}

export function getMatchThatHasBeenLoaded(state) {
	return state.found.resolvedMatch
}

export function getMatchedLocationThatHasBeenLoaded(state) {
	return getMatchThatHasBeenLoaded(state) && getMatchThatHasBeenLoaded(state).location
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