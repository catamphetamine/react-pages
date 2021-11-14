import React from 'react'

import { RouterProvider } from 'found/server'

import render from '../render'

export default function createRouterElement(renderArgs) {
	return (
		<RouterProvider renderArgs={renderArgs}>
			{render(renderArgs)}
		</RouterProvider>
	)
}
