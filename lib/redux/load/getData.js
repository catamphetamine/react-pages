import getLocationUrl from '../../getLocationUrl.js'

import {
	getMatchedRoutes,
	getMatchedRoutesIndices,
	getMatchedRoutesParams,
	getRouteParams,
	getMatchedLocation,
	getMatchedLocationThatHasBeenLoaded,
	RedirectException
} from '../../router/index.js'

import { redirect } from '../../router/actions.js'
import { clearInContext, getFromContext } from '../../context.js'
import clearNavigationState from '../../router/clearNavigationState.js'

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
	context,
	stash
}) {
	const getReturnResult = () => {
		if (routePosition === 'root') {
			// Don't reset the properties for the root route component
			// because the root route component is always the same one
			// in any subsequent (non-initial) navigation,
			// and it's only being loaded once — at the initial load —
			// and any subsequent (non-initial) navigations will return `undefined` from `load()`.
			if (stash.getRootRouteComponentProps()) {
				return {
					props: stash.getRootRouteComponentProps()
				}
			}
		}
	}

	// Optionally skip loading data on client side.
	if (!server) {
		if (
			getFromContext('InitialPage/SkipLoad') ||
			getFromContext('Navigation/SkipLoad') ||
			getFromContext('Page/HotReloadInProgress')
		) {
			if (routePosition === 'leaf') {
				// Reset "skip `load`" flag that was previously set
				// by `pushLocation()` or `replaceLocation()`.
				clearInContext('Navigation/SkipLoad');
			}
			return getReturnResult()
		}
	}

	const { location, previousLocation: previousLocation_ } = getLocations(getState())
	const isInitialClientSidePageLoad = !server && !previousLocation_
	const previousLocation = isInitialClientSidePageLoad ? undefined : previousLocation_

	// A workaround for `found` router bug:
	// https://github.com/4Catalyzer/found/issues/239
	// Prevent executing `load`s on "anchor" link click.
	if (!server && !isInitialClientSidePageLoad) {
		if (shouldSkipLoadForNavigation(previousLocation, location)) {
			return getReturnResult()
		}
	}

	// Execute `load`s.
	return load({
		location,
		previousLocation,
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
		context,
		dispatch,
		useSelector: getter => getter(getState())
	})
	.then(
		(result) => {
			// Anything that gets returned from this `getData()` function
			// gets passed to the page component as a `data` property.
			switch (routePosition) {
				case 'root':
					// `result` will be undefined for "root" route position
					// for any subsequent (non-initial) navigation.
					if (result) {
						stash.setRootRouteComponentProps(result.props)
					} else {
						// Don't reset the properties for the root route component
						// because the root route component is always the same one
						// in any subsequent (non-initial) navigation,
						// and it's only being loaded once — at the initial load —
						// and any subsequent (non-initial) navigations will return `undefined` from `load()`.
						result = getReturnResult()
					}
					break
				case 'leaf':
					if (result) {
						stash.setPageRouteComponentProps(result.props)
					} else {
						// Reset the properties for the page route component
						// because the page component is now different from the previous one.
						stash.setPageRouteComponentProps(undefined)
					}
					break
				default:
					throw new Error(`[react-pages] Unsupported route position: "${routePosition}"`)
			}
			return result
		},
		(error) => {
			// Clear any navigation-related context info
			// because the navigation is cancelled now.
			clearNavigationState()

			// Possibly handle the error (for example, redirect to an error page).
			//
			// The `instanceof RedirectException` check here prevents handling of
			// `dispatch(goto())` / `dispatch(redirect())` when those were called
			// from `.load()` functions, because when called from `.load()` functions,
			// dispatching those two actions throws a `RedirectException`.
			//
			if (error instanceof RedirectException) {
				throw error
			}

			try {
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

				// If no `redirect()` was called in `onLoadError()` handler,
				// it should redirect anyway because the new location wasn't loaded
				// but the new location's URL is still in the web browser's address bar,
				// so that URL should be replaced with some other one.
				// In this case, this is gonna be the previous location's URL.
				const redirectStatusCode = undefined
				throw new RedirectException(previousLocation, redirectStatusCode)
			} catch (error) {
				if (error instanceof RedirectException) {
					throw error
				}

				// Here it handles any non-redirect errors thrown from `.load()` functions.
				// If no `redirect()` was called in `onLoadError()` handler,
				// it should redirect anyway because the new location wasn't loaded
				// but the new location's URL is still in the web browser's address bar,
				// so that URL should be replaced with some other one.
				// In this case, this is gonna be the previous location's URL.
				console.error(error)
				const redirectStatusCode = undefined
				throw new RedirectException(previousLocation, redirectStatusCode)
			}
		}
	)
}

function getLocations(state) {
	const server = typeof window === 'undefined'
	return {
		location: getMatchedLocation(state),
		previousLocation: (server || !getFromContext('App/HasBeenRendered')) ? undefined : getMatchedLocationThatHasBeenLoaded(state)
	}
}