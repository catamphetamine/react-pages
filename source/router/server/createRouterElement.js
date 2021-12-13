import React from 'react'

import { RouterProvider } from 'found/server'

import LocationProvider from '../LocationProvider'

import render from '../render'

export default function createRouterElement(renderArgs) {
	return (
		<LocationProvider location={renderArgs.location}>
			<RouterProvider renderArgs={renderArgs}>
				{render(renderArgs)}
			</RouterProvider>
		</LocationProvider>
	)
}
