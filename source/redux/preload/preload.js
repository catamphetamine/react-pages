import { getLocationUrl } from '../../location'
import throwRedirectError from '../../serverRedirect'

import {
	redirect,
	goto,
	REDIRECT_ACTION_TYPE,
	GOTO_ACTION_TYPE
} from '../../router'

import { isInstantTransition } from '../client/instantBack'

import generatePreloadChain from './collect'

import {
	PRELOAD_FAILED
} from './actions'

import { TRANSLATE_LOCALES_PROPERTY } from '../translate/decorator'

export default function _preload(
	location,
	// `previousLocation` is the location before the transition.
	// Is used for `instantBack`.
	previousLocation,
	routerArgs,
	server,
	onError,
	getLocale,
	dispatch,
	getState
) {
	const isInitialClientSideNavigation = !server && !previousLocation

	// If it's an instant "Back"/"Forward" navigation
	// then navigate to the page without preloading it.
	// (has been previously preloaded and is in Redux state)
	const _isInstantTransition = !server &&
		location.action === 'POP' &&
		previousLocation &&
		isInstantTransition(previousLocation, location)

	// Preload status object.
	// `preloading` holds the cancellation flag for this navigation process.
	// (e.g. preloading `Promise` chain could be cancelled in case of a redirect)
	const preloading = {}

	// Can cancel previous preloading (on the client side)
	let previousPreloading
	if (!server) {
		previousPreloading = window.__preloading_page
		window.__preloading_page = preloading
	}

	if (!server) {
		// If on the client side, then store the current pending navigation,
		// so that it can be cancelled when a new navigation process takes place
		// before the current navigation process finishes.

		// If there's preceeding navigation pending,
		// then cancel that previous navigation.
		if (previousPreloading && previousPreloading.pending && !previousPreloading.cancelled) {
			previousPreloading.cancel()
		}
	}

	const { routes, routeParams, routeIndices, params } = routerArgs
	const components = routes.map(_ => _.Component)

	// Instrument `dispatch`.
	// `dispatch` for server side `throw`s a special "redirect error" on redirect.
	// `dispatch` for client side cancels current `@preload()` on redirect.
	dispatch = instrumentDispatch(dispatch, server, preloading)

	// Preload all the required data for this route (page)
	let preload
	if (!_isInstantTransition) {
		preload = generatePreloadChain(
			isInitialClientSideNavigation,
			server,
			components,
			routeParams,
			getState,
			dispatch,
			location,
			params,
			preloading
		)
	}

	// Load translations (if any).
	let loadTranslation
	if (getLocale) {
		const locale = getLocale(getState())
		// Set the `_key` for each `<Route/>`.
		// Each page component gets `route` property
		// from which it can get the `_key`
		// and using that `_key` it can get the
		// translation data from Redux state.
		routerArgs.routes.forEach((route, i) => {
			route._key = routerArgs.routeIndices.slice(0, i + 1).join('/')
		})
		const translations = components
			.map((component, i) => ({
				path: routerArgs.routes[i]._key,
				getTranslation: component[TRANSLATE_LOCALES_PROPERTY] && component[TRANSLATE_LOCALES_PROPERTY][locale]
			}))
			.filter(_ => _.getTranslation)
		if (translations.length > 0) {
			loadTranslation = () => Promise.all(translations.map(({ path, getTranslation }) => {
				return getTranslation().then((translation) => dispatch('@@react-website/translation', {
					path,
					translation
				}))
			}))
		}
	}

	let promise
	if (preload) {
		if (loadTranslation) {
			promise = Promise.all([preload(), loadTranslation()])
		} else {
			promise = preload()
		}
	} else if (loadTranslation) {
		promise = loadTranslation()
	}

	// If nothing to preload, just move to the next middleware
	if (!promise) {
		return
	}

	preloading.pending = true

	// Preloading process cancellation
	preloading.cancel = () =>
	{
		preloading.cancelled = true

		// If `bluebird` is used,
		// and promise cancellation has been set up,
		// then cancel the `Promise`.
		// http://bluebirdjs.com/docs/api/cancellation.html
		if (promise.cancel) {
			// `.catch()` is to suppress "Uncaught promise rejection" errors
			promise.catch(() => ({})).cancel()
		}
	}

	return promise.then(
		// Navigate to the new page
		() => {
			preloading.pending = false

			// If this navigation process was cancelled
			// before @preload() finished its work,
			// then don't take any further steps on this cancelled navigation.
			if (preloading.cancelled) {
				// Return `false` out of the `Promise`
				// indicating that the navigation was cancelled.
				return false
			}
		},
		(error) =>
		{
			// If this navigation process was cancelled
			// before @preload() finished its work,
			// then don't take any further steps on this cancelled navigation.
			if (!preloading.cancelled) {
				if (!server) {
					preloading.error = error
				}
				// Page loading indicator could listen for this event
				dispatch({ type: PRELOAD_FAILED, error })
			}

			// If the error was a redirection exception (not a error)
			// then just pass it up the stack.
			// (happens only on server side)
			if (server) {
				throw error
			}

			// Update preload status object
			preloading.pending = false

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

// Instrument `dispatch`.
// `dispatch` for server side `throw`s a special "redirect error" on redirect.
// `dispatch` for client side cancels current `@preload()` on redirect.
function instrumentDispatch(dispatch, server, preloading) {
	return (event) => {
		switch (event.type) {
			// In case of navigation from @preload().
			case REDIRECT_ACTION_TYPE:
			case GOTO_ACTION_TYPE:
				if (server) {
					// `throw`s a special redirection `Error` on server side.
					throwRedirectError(event.payload)
				} else {
					// On client side.
					// Discard the currently ongoing preloading.
					if (preloading.cancel) {
						preloading.cancel()
					}
				}
			default:
				// Proceed normally.
				return dispatch(event)
		}
		if (!server) {
			// Mark `http` calls so that they don't get "error handled" twice.
			// (doesn't affect anything, just a minor optimization)
			if (typeof event.promise === 'function') {
				event.preloading = true
			}
		}
	}
}