import flatten from '../utility/flatten.js'

import PathMatcher from '../path-matcher/PathMatcher.js'

const TRAILING_SLASHES_REG_EXP = /\/+$/

export default class RouteMatcher<RouteSegmentShape extends RouteSegment> {
	pathMatcher: PathMatcher<Route<RouteSegmentShape>>

	constructor(routesTree: RouteSegmentShape[]) {
		// Expand a tree of route segments into a linear array of possible routes.
		const routes = expandRoutes(routesTree)
		// Validate that no two routes have the same `path`.
		for (const route of routes) {
			if (routes.some((anotherRoute) => anotherRoute.path === route.path)) {
				throw new Error(`Multiple routes claim same path: ${route.path}`)
			}
		}
		// Replace `path: ""` with `path: "/"`.
		for (const route of routes) {
			if (!route.path) {
				route.path = '/'
			}
		}
		// Create a `PathMatcher` instance from the possible routes.
		this.pathMatcher = new PathMatcher(routes)
	}

	match(path: string): Match<RouteSegmentShape> | undefined {
		path = trimTrailingSlashes(path)
		const match = this.pathMatcher.match(path)
		if (match) {
			return {
				params: match.params,
				routeSegments: match.match.routeSegments
			}
		}
	}
}

function expandRoutes<RouteSegmentShape extends RouteSegment>(
	routeSegments: RouteSegmentShape[],
	basePath: string = ''
): Route<RouteSegmentShape>[] {
	return flatten(
		routeSegments.map((routeSegment) => {
			// Validate that "*" can only be the entire path of a given route.
			if (routeSegment.path === '*') {
				if (basePath) {
					throw new Error('Found a route segment with "*" path but its parent route segments already have a non-empty path "' + basePath + '":\n' + JSON.stringify(routeSegment, null, 2))
				}
			}
			// Validate that a potential ascendant route segment with `path: "*"`
			// doesn't have a descendant route segments with non-empty `path`.
			if (basePath === '*' && routeSegment.path) {
				throw new Error('A route segment with "*" path can\'t have any descendant route segments with a non-empty path')
			}
			// Append the `path` to `basePath`.
			const path = basePath + (routeSegment.path ? '/' + routeSegment.path : '')
			// If this route segment has no children, don't branch it off into multiple routes.
			if (!routeSegment.children) {
				return [{
					path,
					routeSegments: routeSegments.concat(routeSegment)
				}]
			}
			// Branch off the routes for child route segments.
			return flatten(
				expandRoutes(routeSegment.children, path)
			)
		})
	)
}

interface RouteSegment {
	path?: string;
	children?: RouteSegment[];
}

interface Route<RouteSegment> {
	path: string;
	routeSegments: RouteSegment[];
}

interface Match<RouteSegment> {
	params?: Record<string, string>;
	routeSegments: RouteSegment[];
}

function trimTrailingSlashes(path: string) {
	// Trim any potential whitespace.
	path = path.trim()
	// Validate that the path is not empty.
	if (!path) {
		throw new Error('Empty path not allowed')
	}
	// Trim any trailing slashes.
	path = path.replace(TRAILING_SLASHES_REG_EXP, '')
	// See if it didn't unintentionally trim off any leading slashes
	if (!path) {
		path = '/'
	}
	// Return the path without trailing slashes.
	return path
}
