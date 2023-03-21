import React from 'react'

// `@catamphetamine/found` is the same as `found`
// with the only change being that `redux` and `react-redux` packages
// were moved from `dependencies` to `peerDependencies` in `package.json`.
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
