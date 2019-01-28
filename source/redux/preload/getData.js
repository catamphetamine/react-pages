import { getLocationUrl } from '../../location'

import {
	redirect,
	getMatchedRoutes,
	getMatchedRoutesIndices,
	getMatchedRoutesParams,
	getRouteParams,
	getCurrentlyMatchedLocation,
	getPreviouslyMatchedLocation
} from '../../router'

import preload from './preload'

export default function createGetDataForPreload(codeSplit, server, onError, getLocale, getConvertedRoutes) {
	return function({ params, context: { dispatch, getState } }) {
		if (!server) {
			if (window._react_website_skip_preload || window._react_website_hot_reload) {
				return Promise.resolve()
			}
		}
		const { location, previousLocation } = getLocations(getState())
		const isInitialClientSideNavigation = !server && !previousLocation
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
			getLocale,
			dispatch,
			getState
		)
		.then(
			result => result,
			error => {
				// Possibly handle the error (for example, redirect to an error page).
				if (onError) {
					onError(error, {
						path : location.pathname,
						url  : getLocationUrl(location),
						// Using `redirect` instead of `goto` here
						// so that the user can't go "Back" to the page being preloaded
						// in case of an error because it would be in inconsistent state
						// due to `@preload()` being interrupted.
						redirect : to => dispatch(redirect(to)),
						getState,
						server
					})
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
		previousLocation: (server || !window._react_website_router_rendered) ? undefined : getPreviouslyMatchedLocation(state)
	}
}