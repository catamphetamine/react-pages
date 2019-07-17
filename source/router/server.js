import React from 'react'

import ServerProtocol from 'farce/lib/ServerProtocol'

import { RouterProvider } from 'found/lib/server'

import render from './render'

export function createRouterElement(renderArgs) {
	return (
		<RouterProvider renderArgs={renderArgs}>
			{render(renderArgs)}
		</RouterProvider>
	)
}

export function createHistoryProtocol(url) {
	return new ServerProtocol(url)
}