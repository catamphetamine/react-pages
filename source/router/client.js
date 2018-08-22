import React from 'react'

import BrowserProtocol from 'farce/lib/BrowserProtocol'

import createConnectedRouter from 'found/lib/createConnectedRouter'
import resolver from 'found/lib/resolver'
import { ScrollManager } from 'found-scroll'

import render from './render'

export function createRouterElement(renderArgs, getState) {
	const ConnectedRouter = createConnectedRouter({
		render: (renderArgs) => {
			const pageHasLoaded = !getState().preload.pending
			const nextLocation = renderArgs.location
			const previousLocation = getState().found.resolvedMatch.location
			const location = pageHasLoaded ? nextLocation : previousLocation
			const key = window.reactWebsiteRemountOnNavigate === false ? undefined : `${location.pathname}${location.search}`
			return (
				<ScrollManager renderArgs={renderArgs}>
					<Passthrough key={key}>
						{render(renderArgs)}
					</Passthrough>
				</ScrollManager>
			)
		}
	})
	return (
		<ConnectedRouter
			resolver={resolver}
			initialRenderArgs={renderArgs}/>
	)
}

export function createHistoryProtocol() {
	return new BrowserProtocol()
}

function Passthrough(props) {
	return props.children
}