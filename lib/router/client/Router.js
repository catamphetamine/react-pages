import React from 'react'

// `@catamphetamine/found` is a fork of `found` with some changes:
// * `redux` and `react-redux` are `peerDependencies` instead of `dependencies`.
// * `farce` was replaced with `@catamphetamine/farce`.
// * Fixed a bug when `found` ignores all navigation actions until its `componentDidMount()` is called.
import { createConnectedRouter, resolver } from '@catamphetamine/found'

// It turned out that including a modified version of just `ScrollManager.js`
// is simpler that maintaining a fork of `found-scroll`.
// // `@catamphetamine/found-scroll` is a fork of `found-scroll` with some changes
// // * `found` in `peerDependencies` instead of dependencies.
// // * `found` replaced with `@catamphetamine/found`.
// import { ScrollManager } from '@catamphetamine/found-scroll'

// Rewrote `<ScrollManager/>` from `found-scroll` in React hooks.
// Also fixed React strict mode bug.
// https://github.com/4Catalyzer/found-scroll/issues/382
import ScrollManager from './found-scroll/ScrollManager.js'

import RouterContextValueProvider from '../RouterContextValueProvider.js'

import renderRouterElementContent from '../renderRouterElementContent.js'

import { getPageKey } from '../../isSamePage.js'

export default function Router({ dispatch, getState, ...renderArgs }) {
	return React.createElement(
		ConnectedRouter,
		{
			matchContext: {
				dispatch,
				getState
			},
			resolver,
			initialRenderArgs: renderArgs
		}
	)
}

const ConnectedRouter = createConnectedRouter({
	render: (renderArgs) => {
		const { elements } = renderArgs

		// Force re-mount the last route component on location path change.
		// https://github.com/4Catalyzer/found/issues/199#issuecomment-415616836
		if (elements && window.reactPagesRemountOnNavigate !== false) {
			elements[elements.length - 1] = React.cloneElement(elements[elements.length - 1], { key: getPageKey(renderArgs.location) })
		}

		// When a user navigates to a page, this `render()` function is called:
		// * If there's any `load()` data loader:
		//   * The first call is gonna be with `elements: undefined` and the new `location`,
		//     before the page starts loading the initial data.
		//     `<RouterContextValueProvider/>` ignores this `render()` call.
		//   * The second call is gonna be with `elements: React.Element[]` and the new `location`,
		//     after the page has loaded the initial data.
		// * Otherwise, if there's no data to load:
		//   * The page just renders with `elements: React.Element[]` and the new `location`.
		return React.createElement(
			RouterContextValueProvider,
			{
				// `elements` is `undefined` when router starts loading the next page.
				// In that case, the previous page is still rendered, so it shouldn't
				// pass the new `location` to `<RouterContextValueProvider/>` yet.
				location: elements && renderArgs.location,
				params: elements && renderArgs.params,
				routes: elements && renderArgs.routes
			},
			React.createElement(
				ScrollManager,
				{ renderArgs },
				renderRouterElementContent(renderArgs)
			)
		)
	}
})