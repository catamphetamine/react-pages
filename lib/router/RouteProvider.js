import React, { useRef, useMemo } from 'react'
import PropTypes from 'prop-types'

import getRoutePath from './getRoutePath.js'

import RouteContext from './RouteContext.js'

export default function RouteProvider({
	location,
	routes,
	params,
	children
}) {
	const getRoute = () => ({
		location,
		params,
		path: getRoutePath(routes)
	})

	const initialRoute = useMemo(() => getRoute(), [])

	const currentRoute = useRef(initialRoute)

	// `location` is `undefined` when router starts loading the next page.
	// In that case, the previous page is still rendered, so `currentRoute`
	// shouldn't change.
	if (location) {
		if (location !== currentRoute.current) {
			currentRoute.current = getRoute()
		}
	}

	return React.createElement(
		RouteContext.Provider,
		{ value: currentRoute.current },
		children
	)
}

const routeShape = {
	// A `route` doesn't always have a `path` property:
	// `found` router allows that when nesting routes.
	// Example: `{ Component: Wrapper, children: { path: '/', Component: Home } }`.
	path: PropTypes.string
}

routeShape.children = PropTypes.arrayOf(PropTypes.shape(routeShape))

const routeType = PropTypes.shape(routeShape)

RouteProvider.propTypes = {
	location: PropTypes.shape({
		pathname: PropTypes.string.isRequired,
		query: PropTypes.objectOf(PropTypes.string).isRequired,
		search: PropTypes.string.isRequired,
		hash: PropTypes.string.isRequired,

		// Miscellaneous (not used).

		// Some kind of a possibly-likely-unique key. Is empty for the initial page.
		key: PropTypes.string,

		// History entry state. Can be empty.
		state: PropTypes.any,

		// Index in browser history stack.
		index: PropTypes.number.isRequired,

		// The "delta" in terms of `index` change as a result of the navigation.
		// For example, a regular hyperlink click is `delta: 1`.
		// A "Back" action is `delta: -1`. A user could go several pages "Back".
		delta: PropTypes.number,

		// 'PUSH' or 'REPLACE' if the location was reached via history "push" or
    // "replace" action respectively. 'POP' on the initial location, or if
		// the location was reached via the browser "Back" or "Forward" buttons
		// or via `FarceActions.go`.
		action: PropTypes.oneOf(['PUSH', 'REPLACE', 'POP']).isRequired
	}),

	routes: PropTypes.arrayOf(routeType),

	params: PropTypes.objectOf(PropTypes.string),

	children: PropTypes.node
}