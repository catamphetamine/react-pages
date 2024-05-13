import React from 'react'

// `@catamphetamine/found` is a fork of `found` with some changes:
// * `redux` and `react-redux` are `peerDependencies` instead of `dependencies`.
// * `farce` was replaced with `@catamphetamine/farce`.
// * Fixed a bug when `found` ignores all navigation actions until its `componentDidMount()` is called.
import { RouterProvider } from '@catamphetamine/found/lib/cjs/server.js'

import RouterContextValueProvider from '../RouterContextValueProvider.js'

import renderRouterElementContent from '../renderRouterElementContent.js'

export default function Router(renderArgs) {
	return React.createElement(
		RouterContextValueProvider,
		{
			location: renderArgs.location,
			params: renderArgs.params,
			routes: renderArgs.routes
		},
		React.createElement(
			RouterProvider,
			{ renderArgs },
			renderRouterElementContent(renderArgs)
		)
	)
}
