import React from 'react'

// `@catamphetamine/found` is a fork of `found` with some changes:
// * `redux` and `react-redux` are `peerDependencies` instead of `dependencies`.
// * `farce` was replaced with `@catamphetamine/farce`.
// * Fixed a bug when `found` ignores all navigation actions until its `componentDidMount()` is called.
import { RouterProvider } from '@catamphetamine/found/lib/cjs/server.js'

import RouteProvider from '../RouteProvider.js'

import render from '../render.js'

export default function createRouterElement(renderArgs) {
	return React.createElement(
		RouteProvider,
		{
			location: renderArgs.location,
			params: renderArgs.params,
			routes: renderArgs.routes
		},
		React.createElement(
			RouterProvider,
			{ renderArgs },
			render(renderArgs)
		)
	)
}
