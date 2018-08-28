import { getLocationUrl } from '../../location'

import {
	redirect,
	getMatchedRoutes,
	getMatchedRoutesParams,
	getRouteParams,
	getCurrentlyMatchedLocation,
	getPreviouslyMatchedLocation
} from '../../router'

import preload from './preload'

export default function createGetDataForPreload(server, onError, getLocale, getConvertedRoutes) {
	return function({ params, context }) {
		let isInitialClientSideNavigation
		if (!server) {
			if (!window._react_website_routes_rendered) {
				isInitialClientSideNavigation = true
				window._react_website_routes_rendered = true
			}
			if (window._react_website_skip_preload) {
				return Promise.resolve()
			}
		}
		const { dispatch, getState } = context
		const location = getCurrentlyMatchedLocation(getState())
		const previousLocation = (server || isInitialClientSideNavigation) ? undefined : getPreviouslyMatchedLocation(getState())
		return preload(
			location,
			previousLocation,
			{
				routes: getMatchedRoutes(getState(), getConvertedRoutes()),
				routeParams: getMatchedRoutesParams(getState()),
				params: getRouteParams(getState())
			},
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