import clientSideRender from '../../client/render'
import { isServerSidePreloaded } from '../../client/flags'
import { getCookie } from '../../client/cookies'
import render from './render'
import getState from './getState'
import createHttpClient from '../HttpClient'
import normalizeSettings from '../normalize'
import createStore from '../store'
import { resetInstantNavigationChain } from './instantNavigation'
import createHistoryProtocol from '../../router/client/createHistoryProtocol'
import { redirect, _RESOLVE_MATCH, pushLocation, RedirectException } from '../../router'
import { showInitialPreload, hideInitialPreload } from './initialPreload'

// This function is what's gonna be called from the project's code on the client-side.
//
// There are two passes of client-side render happening here.
// React has the concept of "re-hydration" which demands that
// the initial client-side React rendering results be equal to
// the server-side React rendering results, character-by-character.
// Otherwise it complains.
// That's the reason why the application on client side first performs
// a "dummy" rendering without resolving any `load`s, just to complete
// the React "hydration" process, and only when the "hydration" process finishes
// does it perform the second pass of rendering the page,
// now resolving all client-side `load`s.
// Therefore, the first pass of `.render()` always happens with data missing
// if that data is loaded in "client-side only" `load`s.
// (that is, the `load`s configured with `{ client: true }`).
//
// If React "re-hydration" step didn't exist
// then the library would first execute all client-side preloads
// and only then would it render the application.
// That would be more intuitive and convenient for developers I guess.
//
export default function setUpAndRender(settings, options = {}) {

	settings = normalizeSettings(settings)

	const {
		devtools,
		stats,
		onBeforeNavigate,
		onNavigate,
		onStoreCreated
	} = options

	// Redux store.
	let store

	// Create HTTP client (Redux action creator `http` utility)
	const httpClient = createHttpClient(settings, () => store)
	// E.g. for WebSocket message handlers, since they only run on the client side.
	window._react_pages_http_client = httpClient

	// Reset "instant back" on page reload
	// since Redux state is cleared.
	// "instant back" chain is stored in `window.sessionStorage`
	// and therefore it survives page reload.
	resetInstantNavigationChain()

	// `showLoadingInitially` is handled in a special way
	// in case of client-side-only rendering.
	const showLoadingInitially = settings.showLoadingInitially

	// The first pass of initial client-side render
	// is to render the markup which matches server-side one.
	// The second pass will be to render after resolving `getData`.
	if (isServerSidePreloaded()) {
		window._react_pages_initial_prerender = true
		window._react_pages_skip_preload = true
	}

	// Create Redux store
	store = createStore(
		{
			...settings,
			showLoadingInitially: !isServerSidePreloaded() && showLoadingInitially ? false : showLoadingInitially
		},
		getState(true),
		createHistoryProtocol,
		httpClient, {
			devtools,
			stats,
			onBeforeNavigate,
			onNavigate,
			getCookie
		}
	)

	// `onStoreCreated(store)` is called here.
	//
	// For example, client-side-only applications
	// may capture this `store` as `window.store`
	// to call `bindActionCreators()` for all actions (globally).
	//
	// onStoreCreated: store => window.store = store
	//
	// import { bindActionCreators } from 'redux'
	// import actionCreators from './actions'
	// const boundActionCreators = bindActionCreators(actionCreators, window.store.dispatch)
	// export default boundActionCreators
	//
	// Not saying that this is even a "good" practice,
	// more like "legacy code", but still my employer
	// happened to have such binding, so I added this feature.
  // Still this technique cuts down on a lot of redundant "wiring" code.
  //
	if (onStoreCreated) {
		onStoreCreated(store)
	}

	// Render loading indicator in case of client-side-only rendering
	// because the main application React tree won't be rendered
	// until `load`s finish.
	let showingInitialPreload = false
	if (!isServerSidePreloaded() && showLoadingInitially) {
		showInitialPreload()
		showingInitialPreload = true
	}

	// Render the page.
	// If it's a server-side rendering case then that will be the
	// first pass, without loading data, just for `React.hydrate()`.
	// If it's a client-side rendering case then that will be the
	// first pass with loading data.
	return clientSideRender({
		container: settings.container,
		render,
		renderParameters: {
			store
		}
	})
	.then((result) => {
		// Perform the second pass of initial client-side rendering.
		// The second pass resolves `getData` on routes.
		// (which means it resolves all client-side `load`s)
		if (isServerSidePreloaded()) {
			store.dispatch(redirect(document.location))
		} else {
			// Hide the "initial" loading indicator.
			if (showingInitialPreload) {
				hideInitialPreload()
			}
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
			store.dispatch({
				type: _RESOLVE_MATCH,
				payload: window._react_pages_update_match_event_payload
			})
		}
		return result
	}, (error) => {
		// Hide the "initial" loading indicator.
		if (showingInitialPreload) {
			hideInitialPreload()
		}
		// Catches redirects from `load`s,
		// redirects from `onError` and from `<Redirect/>` routes.
		if (error instanceof RedirectException) {
			// Change current location.
			store.dispatch(pushLocation(error.location))
			// Reset all `react-pages` flags.
			for (const key in window) {
				if (key.indexOf('_react_pages_') === 0 && key !== '_react_pages_locales') {
					window[key] = undefined
				}
			}
			// Re-render.
			return setUpAndRender(settings, options)
		}
		throw error
	})
}