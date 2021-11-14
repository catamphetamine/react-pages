import { UPDATE_MATCH, RESOLVE_MATCH, _RESOLVE_MATCH, getRoutesByPath, getRoutePath } from '../../router'
import { getComponentsMeta, mergeMeta, updateMeta, getCodeSplitMeta, dropUndefinedProperties } from '../../meta/meta'
import { getLocationUrl, shouldSkipPreloadForNavigation } from '../../location'

import {
	PRELOAD_STARTED,
	PRELOAD_FINISHED,
	PRELOAD_FAILED
} from '../preload/actions'

import {
	isInstantTransition,
	setInstantNavigationFlag,
	addInstantBack,
	updateInstantNavigationChainIndex,
	resetInstantNavigationChain
} from '../client/instantNavigation'

import { isServerSidePreloaded } from '../../client/flags'

const ON_PAGE_LOADED_METHOD_NAME = 'onLoaded'

// Any events listened to here are being dispatched on client side.
export default function routerMiddleware(
	routes,
	codeSplit,
	onBeforeNavigate,
	onNavigate,
	reportStats,
	defaultMeta
) {
	let startedAt
	let previousLocation
	let previousRouteIndices

	defaultMeta = dropUndefinedProperties(defaultMeta)

	return ({ dispatch, getState }) =>
	{
		return next => event =>
		{
			// Skip the first pass of the initial client-side render.
			// for the case when server-side rendering is used.
			if (window._react_pages_initial_prerender) {
				return next(event)
			}

			const location = event.payload && event.payload.location
			const routeIndices = event.payload && event.payload.routeIndices

			switch (event.type) {
				case UPDATE_MATCH:
					// A workaround for `found` router bug:
					// https://github.com/4Catalyzer/found/issues/239
					// Skip `load` and other stuff for anchor link navigation.
					if (previousLocation && shouldSkipPreloadForNavigation(previousLocation, location)) {
						// I guess this workaround won't work with `codeSplit: true`
						// because `codeSplit` doesn't use the global `getData` loader.
						if (!codeSplit) {
							break
						}
					}

					// Store `event.payload` for the future `_UPDATE_MATCH` event.
					if (!window._react_pages_router_rendered && !isServerSidePreloaded()) {
						window._react_pages_update_match_event_payload = event.payload
					}

					// Measure `load` and `render` time.
					startedAt = Date.now()

					// If it's an instant "Back"/"Forward" navigation
					// then navigate to the page without loading it.
					// (has been previously preloaded and is in Redux state)
					const _isInstantTransition =
						location.action === 'POP' &&
						previousLocation &&
						isInstantTransition(previousLocation, location)

					// Set the flag for `wasInstantNavigation()`.
					setInstantNavigationFlag(_isInstantTransition)

					// Indicates whether an `instantBack` `<Link/>` has been clicked.
					// (or if `goto()` has been called with `instantBack: true` option)
					const instantBack = window._react_pages_instant_back_navigation

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
					} else if (_isInstantTransition) {
						updateInstantNavigationChainIndex(location)
					} else {
						// If current transition is not "instant back" and not "instant"
						// then reset the whole "instant back" chain.
						// Only a consequitive "instant back" navigation chain
						// preserves the ability to instantly navigate "Back".
						// Once a regular navigation takes place
						// all previous "instant back" possibilities are discarded.
						resetInstantNavigationChain()
					}

					// Set the flag for `isInstantBackAbleNavigation()`.
					// `instantBack` is for a "forward" instant-back-able navigation.
					// `_isInstantTransition` is for a "backwards" instant-back-able navigation.
					if (instantBack || _isInstantTransition) {
						window._react_pages_is_instant_back_able_navigation = true
					}

					// // `RESOLVE_MATCH` is not being emitted
					// // for the first render for some reason.
					// // https://github.com/4Catalyzer/found/issues/202
					// const isFirstRender = !previousLocation
					// if (isFirstRender) {
					// 	updateMetaTags(
					// 		routeIndices,
					// 		getState(),
					// 		{
					// 			routes,
					// 			codeSplit,
					// 			defaultMeta
					// 		}
					// 	)
					// } else {
					// 	// Show page loading indicator.
					// 	dispatch({ type: PRELOAD_STARTED })
					// }

					if (onBeforeNavigate) {
						onBeforeNavigate({
							dispatch,
							getState,
							location: event.payload.location,
							params: event.payload.params
						})
					}

					// Show page loading indicator.
					if (!isServerSidePreloaded() && !window._react_pages_router_rendered) {
						// Don't show page loading indicator
						// because it's already being shown manually.
					} else {
						// Show page loading indicator.
						dispatch({ type: PRELOAD_STARTED })
					}

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
					// A workaround for `found` router bug:
					// https://github.com/4Catalyzer/found/issues/239
					// Skip `load` and other stuff for anchor link navigation.
					if (previousLocation && shouldSkipPreloadForNavigation(previousLocation, location)) {
						// I guess this workaround won't work with `codeSplit: true`
						// because it doesn't use the global `getData` loader.
						if (!codeSplit) {
							break
						}
					}

					// `routeIndices` might be `undefined` after a `<Redirect/>`
					// is made and a user clicks the "Back" button in a web browser.
					// https://github.com/4Catalyzer/found/issues/632
					if (!routeIndices) {
						throw new Error(`"${event.type}" Redux action misses "routeIndices" property. This usually means that the target URL path "${location.pathname}" didn't match any route. ${location.pathname[0] !== '/' ? 'The target URL path is missing a leading slash: correct your routes configuration to include a leading slash for "' + location.pathname + '" path. ' : ''}See the issue for more info: https://github.com/4Catalyzer/found/issues/632`)
					}

					// `previousLocation` is only used for "instant back" navigation.
					// Therefore it can be skipped in case of anchor link navigation.
					previousLocation = location
					previousRouteIndices = routeIndices

					if (!window._react_pages_router_rendered) {
						window._react_pages_router_rendered = true
					}

					// Call `onLoaded`.
					if (!codeSplit) {
						const routeChain = getRoutesByPath(routeIndices, routes)
						const pageRoute = routeChain[routeChain.length - 1]
						// Routes don't have `.Component` property
						// set when using `codeSplit` feature.
						const onPageLoaded = pageRoute.Component[ON_PAGE_LOADED_METHOD_NAME]
						if (onPageLoaded) {
							onPageLoaded({ dispatch, getState, location })
						}
					}

					// Update `<meta/>`.
					updateMetaTags(
						routeIndices,
						getState(),
						{
							routes,
							codeSplit,
							defaultMeta
						}
					)

					if (onNavigate) {
						onNavigate(getLocationUrl(location), location, {
							dispatch,
							getState
						})
					}

					// Reset the flag for `isInstantBackAbleNavigation()`.
					window._react_pages_is_instant_back_able_navigation = false

					// Report page loading time.
					// This loading time will be longer then
					// the server-side one, say, by 10 milliseconds,
					// probably because the web browser making
					// an asynchronous HTTP request is slower
					// than the Node.js server making a regular HTTP request.
					// Also this includes network latency
					// for a particular website user, etc.
					// So this `load` time doesn't actually describe
					// the server-side performance.
					if (reportStats) {
						reportStats({
							url: getLocationUrl(location),
							// Concatenated route `path` string.
							// E.g. "/user/:user_id/post/:post_id"
							route: getRoutePath(getRoutesByPath(routeIndices, routes)),
							time: {
								loadAndRender: Date.now() - startedAt
							}
						})
					}

					// Hide page loading indicator.
					dispatch({ type: PRELOAD_FINISHED })

					// Report loading time in console for debugging.
					if (Date.now() - startedAt > 30) {
						console.log(`[react-pages] "${location.pathname}" loaded and rendered in ${Date.now() - startedAt} ms`)
					}

					break
			}

			return next(event)
		}
	}
}

function updateMetaTags(routeIndices, state, { routes, codeSplit, defaultMeta }) {
	const routeChain = getRoutesByPath(routeIndices, routes)
	// Get `<meta/>` for the route.
	let meta = codeSplit ? getCodeSplitMeta(routeChain, state) : getComponentsMeta(routeChain.map(_ => _.Component), state)
	meta = mergeMeta(meta)
	meta = { ...defaultMeta, ...meta }
	// Update `<meta/>`.
	updateMeta(meta)
}