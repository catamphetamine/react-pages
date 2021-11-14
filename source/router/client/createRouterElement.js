import React from 'react'

import createConnectedRouter from 'found/createConnectedRouter'
import resolver from 'found/resolver'
import { ScrollManager } from 'found-scroll'

import render from '../render'

export default function createRouterElement(renderArgs, { dispatch, getState }) {
	const ConnectedRouter = createConnectedRouter({
		render: (renderArgs) => {
			// Force re-mount the last route component on location path change.
			// https://github.com/4Catalyzer/found/issues/199#issuecomment-415616836
			const elements = renderArgs.elements
			if (elements && window.reactPagesRemountOnNavigate !== false) {
				elements[elements.length - 1] = React.cloneElement(elements[elements.length - 1], { key: renderArgs.location.pathname })
			}
			return (
				<ScrollManager renderArgs={renderArgs}>
					{render(renderArgs)}
				</ScrollManager>
			)
		}
	})
	return (
		<ConnectedRouter
			matchContext={{
				dispatch,
				getState
			}}
			resolver={resolver}
			initialRenderArgs={renderArgs}/>
	)
}