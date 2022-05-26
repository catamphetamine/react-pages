import React from 'react'

import { RouterProvider } from '@catamphetamine/found/lib/cjs/server.js'

import LocationProvider from '../LocationProvider.js'

import render from '../render.js'

export default function createRouterElement(renderArgs) {
	return React.createElement(
		LocationProvider,
		{ location: renderArgs.location },
		React.createElement(
			RouterProvider,
			{ renderArgs },
			render(renderArgs)
		)
	)
}
