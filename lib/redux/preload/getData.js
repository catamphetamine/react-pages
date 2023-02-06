import getLocationUrl from '../../getLocationUrl.js'

import {
	redirect,
	getMatchedRoutes,
	getMatchedRoutesIndices,
	getMatchedRoutesParams,
	getRouteParams,
	getCurrentlyMatchedLocation,
	getPreviouslyMatchedLocation,
	RedirectException
} from '../../router/index.js'

import shouldSkipPreloadForNavigation from './shouldSkipPreloadForNavigation.js'
import preload from './preload.js'

export default function createGetDataForPreload(codeSplit, server, onError, getLocale, getConvertedRoutes, getCookie) {
	return function({ params, context: { dispatch, getState } }) {
		if (!server) {
			if (window._ReactPages_Page_SkipDataLoad ||
				window._ReactPages_Page_SkipDataLoad_on_navigation ||
				window._ReactPages_Page_HotReloadInProgress) {
				// Reset "skip `load`" flag for `pushLocation()` and `replaceLocation()`.
				if (window._ReactPages_Page_SkipDataLoad_on_navigation) {
					window._ReactPages_Page_SkipDataLoad_on_navigation = false;
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
			if (shouldSkipPreloadForNavigation(previousLocation, location)) {
				return
			}
		}
		// Execute `load`s.
		return preload(
			location,
			isInitialClientSideNavigation ? undefined : previousLocation,
			{
				routes: getMatchedRoutes(getState(), getConvertedRoutes()),
				routeIndices: getMatchedRoutesIndices(getState()),
				routeParams: getMatchedRoutesParams(getState()),
				params: getRouteParams(getState())
			},
			codeSplit,
			server,
			getCookie,
			getLocale,
			dispatch,
			getState
		)
		.then(
			(result) => result,
			(error) => {
				// Possibly handle the error (for example, redirect to an error page).
				if (!(error instanceof RedirectException)) {
					if (onError) {
						onError(error, {
							path : location.pathname,
							url  : getLocationUrl(location),
							// Using `redirect` instead of `goto` here
							// so that the user can't go "Back" to the page being preloaded
							// in case of an error because it would be in inconsistent state
							// due to `load` being interrupted.
							redirect(to) {
								// `to` can be a `string`.
								throw new RedirectException(to)
							},
							dispatch,
							getState,
							server
						})
					}
				}
				throw error
			}
		)
	}
}

function getLocations(state) {
	const server = typeof window === 'undefined'
	return {
		location: getCurrentlyMatchedLocation(state),
		previousLocation: (server || !window._ReactPages_RouterHasFinishedInitialRender) ? undefined : getPreviouslyMatchedLocation(state)
	}
}