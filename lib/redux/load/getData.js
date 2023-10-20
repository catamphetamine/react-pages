import getLocationUrl from '../../getLocationUrl.js'

import {
	redirect,
	getMatchedRoutes,
	getMatchedRoutesIndices,
	getMatchedRoutesParams,
	getRouteParams,
	getMatchedLocation,
	getMatchedLocationThatHasBeenLoaded,
	RedirectException
} from '../../router/index.js'

import shouldSkipLoadForNavigation from './shouldSkipLoadForNavigation.js'
import load from './load.js'

export default function getData({
	routes,
	routePosition,
	params,
	dispatch,
	getState,
	codeSplit,
	server,
	onError,
	getLocale,
	getCookie,
	stash
}) {
	if (!server) {
		if (window._ReactPages_Page_SkipDataLoad ||
			window._ReactPages_Page_SkipDataLoadOnNavigation ||
			window._ReactPages_Page_HotReloadInProgress) {
			if (routePosition === 'leaf') {
				// Reset "skip `load`" flag that was previously set
				// by `pushLocation()` or `replaceLocation()`.
				if (window._ReactPages_Page_SkipDataLoadOnNavigation) {
					delete window._ReactPages_Page_SkipDataLoadOnNavigation;
				}
			}
			return
		}
	}
	const { location, previousLocation } = getLocations(getState())
	const isInitialClientSideNavigation = !server && !previousLocation
	// A workaround for `found` router bug:
	// https://github.com/4Catalyzer/found/issues/239
	// Prevent executing `load`s on "anchor" link click.
	if (!server && !isInitialClientSideNavigation) {
		if (shouldSkipLoadForNavigation(previousLocation, location)) {
			return
		}
	}
	// Execute `load`s.
	return load({
		location,
		previousLocation: isInitialClientSideNavigation ? undefined : previousLocation,
		routerArgs: {
			routes: getMatchedRoutes(getState(), routes),
			routeIndices: getMatchedRoutesIndices(getState()),
			routeParams: getMatchedRoutesParams(getState()),
			params: getRouteParams(getState())
		},
		routePosition,
		codeSplit,
		server,
		getCookie,
		getLocale,
		dispatch,
		useSelector: getter => getter(getState())
	})
	.then(
		(result) => {
			// Anything that gets returned from this `getData()` function
			// gets passed to the page component as a `data` property.
			switch (routePosition) {
				case 'root':
					stash.setRootComponentProps(result && result.props)
					break
				case 'leaf':
					stash.setPageComponentProps(result && result.props)
					break
				default:
					throw new Error(`[react-pages] Unsupported route position: "${routePosition}"`)
			}
			return result
		},
		(error) => {
			// Possibly handle the error (for example, redirect to an error page).
			if (!(error instanceof RedirectException)) {
				if (onError) {
					onError(error, {
						location,
						url: getLocationUrl(location),
						// Using `redirect` instead of `goto` here
						// so that the user can't go "Back" to the page being loaded
						// in case of an error because it would be in inconsistent state
						// due to `load` being interrupted.
						redirect(to) {
							// `to` can be a `string`.
							//
							// 307 Temporary Redirect
							// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307
							// 308 Permanent Redirect
							// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308
							//
							const redirectStatusCode = undefined
							throw new RedirectException(to, redirectStatusCode)
						},
						dispatch,
						useSelector: getter => getter(getState()),
						server
					})
				}
			}
			throw error
		}
	)
}

function getLocations(state) {
	const server = typeof window === 'undefined'
	return {
		location: getMatchedLocation(state),
		previousLocation: (server || !window._ReactPages_RouterHasFinishedInitialRender) ? undefined : getMatchedLocationThatHasBeenLoaded(state)
	}
}