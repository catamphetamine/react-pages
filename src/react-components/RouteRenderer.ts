import { useEffect, useRef, useState } from 'react'

import type { Location } from 'navigation-stack'

import RouteMatcher from '../route-matcher/RouteMatcher.js'

import type { Routes } from '../types.d.js'

import useLocation from '../react-hooks/useLocation.js'

export default function RouteRenderer<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any>,
	Cookies extends Record<string, any>
>({
	routes
}: RouteRendererProps<
	LoadContext,
	NavigationContext,
	MetaContext,
	Props,
	LocationParameters,
	Cookies
>) {
	const location = useLocation()
	const prevLocation = useRef<Location>(undefined)

	const routeMatcher = useRef(new RouteMatcher(routes))

	const [initialized, setInitialized] = useState(false)
	const [route, setRoute] = useState<Route | undefined>(undefined)

	useEffect(() => {
		if (location !== prevLocation.current) {
			prevLocation.current = location
		}
		const match = routeMatcher.current.match(location.pathname)
		setInitialized(true)
		if (match) {
			setRoute({
				params: match.params,
				routeSegments: match.routeSegments.filter(_ => _.component)
			})
		}
		// Somehow
	}, [location])

	if (initialized) {
		if (!route) {
			// No route matches the current `location.pathname`.
			// Find and render a "path: '*'" route, if it exists.
			// If it doesn't exist, render a blank page.
			return null
		}
		// Render the `route`.
		return null
	}

	// The router is not ready.
	// Don't render anything yet.
	return null
}

interface Route {
	params?: Record<string, string>;
	routeSegments: RouteSegment[];
}

interface RouteSegment {
	component?: React.ElementType | (() => Promise<React.ElementType>);
}

interface RouteRendererProps<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any>,
	Cookies extends Record<string, any>
> {
	routes: Routes<
		LoadContext,
		NavigationContext,
		MetaContext,
		Props,
		LocationParameters,
		Cookies
	>;
}