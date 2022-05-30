import React from 'react'

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
