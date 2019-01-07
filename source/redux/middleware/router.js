import { UPDATE_MATCH, RESOLVE_MATCH, _RESOLVE_MATCH, getRoutesByPath, getRoutePath } from '../../router'
import { getComponentsMeta, mergeMeta, updateMeta, getCodeSplitMeta } from '../../meta/meta'
import { getLocationUrl } from '../../location'

import {
	PRELOAD_STARTED,
	PRELOAD_FINISHED,
	PRELOAD_FAILED
} from '../preload/actions'

import {
	isInstantTransition,
	setInstantNavigationFlag,
	addInstantBack,
	resetInstantBack
} from '../client/instantBack'

export default function routerMiddleware(
	routes,
	codeSplit,
	onNavigate,
	reportStats,
	defaultMeta
) {
	let startedAt
	let previousLocation
	let previousRouteIndices

	function updateMetaTags(routeIndices, state) {
		const routeChain = getRoutesByPath(routeIndices, routes)
		// Get `<meta/>` for the route.
		let meta = codeSplit ? getCodeSplitMeta(routeChain, state) : getComponentsMeta(routeChain.map(_ => _.Component), state)
		meta = mergeMeta(meta)
		meta = { ...defaultMeta, ...meta }
		// Update `<meta/>`.
		updateMeta(meta)
	}

	return ({ dispatch, getState }) =>
	{
		return next => event =>
		{
			// Skip the first pass of the initial client-side render.
			if (window._react_website_initial_prerender) {
				return next(event)
			}

			const location = event.payload && event.payload.location
			const routeIndices = event.payload && event.payload.routeIndices

			switch (event.type) {
				case UPDATE_MATCH:
					// Store `event.payload` for the future `_UPDATE_MATCH` event.
					if (!window._server_side_render) {
						window._react_website_update_match_payload = event.payload
					}

					// Measure `@preload()` time.
					startedAt = Date.now()

					// If it's an instant "Back"/"Forward" navigation
					// then navigate to the page without preloading it.
					// (has been previously preloaded and is in Redux state)
					const _isInstantTransition =
						location.action === 'POP' &&
						previousLocation &&
						isInstantTransition(previousLocation, location)

					// Set the flag for `wasInstantNavigation()`.
					setInstantNavigationFlag(_isInstantTransition)

					if (onNavigate) {
						onNavigate(getLocationUrl(location), location)
					}

					// Indicates whether an `instantBack` `<Link/>` was clicked.
					const instantBack = window._react_website_instant_back

					// Update instant back navigation chain.
					if (instantBack) {
						// Stores "current" (soon to be "previous") location
						// in "instant back chain", so that if "Back" is clicked
						// then such transition could be detected as "should be instant".
						addInstantBack(
							location,
							previousLocation,
							routeIndices,
							previousRouteIndices
						)
					} else if (!_isInstantTransition) {
						// If current transition is not "instant back" and not "instant"
						// then reset the whole "instant back" chain.
						// Only a consequitive "instant back" navigation chain
						// preserves the ability to instantly navigate "Back".
						// Once a regular navigation takes place
						// all previous "instant back" possibilities are discarded.
						resetInstantBack()
					}

					// // `RESOLVE_MATCH` is not being emitted
					// // for the first render for some reason.
					// // https://github.com/4Catalyzer/found/issues/202
					// const isFirstRender = !previousLocation
					// if (isFirstRender) {
					// 	updateMetaTags(routeIndices, getState())
					// } else {
					// 	// Show page loading indicator.
					// 	dispatch({ type: PRELOAD_STARTED })
					// }

					// Show page loading indicator.
					dispatch({ type: PRELOAD_STARTED })

					previousLocation = location
					previousRouteIndices = routeIndices
					break

				// `RESOLVE_MATCH` is not being dispatched
				// for the first render for some reason.
				// https://github.com/4Catalyzer/found/issues/202
				// With server-side rendering enabled
				// initially there are two rendering passes
				// and therefore `RESOLVE_MATCH` does get dispatched
				// after the page is initialized and rendered.
				// With server-side rendering disabled
				// `RESOLVE_MATCH` does not get dispatched
				// therefore a custom `_RESOLVE_MATCH` event is
				// dispatched manually.
				case RESOLVE_MATCH:
				case _RESOLVE_MATCH:
					window._react_website_router_rendered = true

					updateMetaTags(routeIndices, getState())

					// Report preloading time.
					// This preloading time will be longer then
					// the server-side one, say, by 10 milliseconds,
					// probably because the web browser making
					// an asynchronous HTTP request is slower
					// than the Node.js server making a regular HTTP request.
					// Also this includes network latency
					// for a particular website user, etc.
					// So this `preload` time doesn't actually describe
					// the server-side performance.
					if (reportStats) {
						reportStats({
							url: getLocationUrl(location),
							// Concatenated `react-router` route string.
							// E.g. "/user/:user_id/post/:post_id"
							route: getRoutePath(getRoutesByPath(routeIndices, routes)),
							time: {
								preload: Date.now() - startedAt
							}
						})
					}

					// Hide page loading indicator.
					dispatch({ type: PRELOAD_FINISHED })

					// Report preload time in console for debugging.
					if (Date.now() - startedAt > 30) {
						console.log(`[react-website] "${location.pathname}" loaded in ${Date.now() - startedAt} ms`)
					}

					break
			}

			return next(event)
		}
	}
}