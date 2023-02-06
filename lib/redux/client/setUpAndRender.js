import clientSideRender from '../../client/render.js'
import { isServerSidePreloaded } from '../../client/flags.js'
import { RESOLVE_MATCH } from '../../router/index.js'
import render from './render.js'
import normalizeSettings from '../normalize.js'
import createStore from './createStore.js'
import { resetInstantNavigationChain } from './instantNavigation.js'
import { redirect, _RESOLVE_MATCH, pushLocation, RedirectException } from '../../router/index.js'
import { showInitialPreload, hideInitialPreload } from './initialPreload.js'

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
export default function setUpAndRender(settings, options) {
	settings = normalizeSettings(settings)

	// Reset "instant back" on page reload
	// since Redux state is cleared.
	// "instant back" chain is stored in `window.sessionStorage`
	// and therefore it survives page reload.
	resetInstantNavigationChain()

	// `showLoadingInitially` is handled in a special way
	// in case of client-side-only rendering.
	const { showLoadingInitially } = settings

	// The first pass of initial client-side render
	// is to render the markup which matches server-side one.
	// The second pass will be to render after resolving `getData`.
	if (isServerSidePreloaded()) {
		window._ReactPages_Page_ServerSideRenderedPageRestorationPrerender = true
		window._ReactPages_Page_SkipDataLoad = true
	}

	// Create a Redux `store` if not passed.
	if (!settings.store) {
		// Create a Redux store (and, internally, an HTTP client).
		// Mutate `settings` because they're passed again "recursively"
		// in a `catch` clause below.
		settings.store = createStore(settings, options)
	}

	const { store } = settings

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
				payload: window._ReactPages_SimulatedResolveMatchEventPayload
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
			// Reset all `react-pages` flags related to:
			// * the current page properties.
			// * the current navigation properties.
			// * the navigation chain so far.
			for (const key in window) {
				if (key.indexOf('_ReactPages_Page_') === 0 || key.indexOf('_ReactPages_Navigation_') === 0) {
					window[key] = undefined
				}
			}

			// Change current location.
			// Emits a `UPDATE_MATCH` event.
			// `error.location` can be a `string`.
			// Maybe it could be a location `object` too.
			store.dispatch(pushLocation(error.location))

			// Simply emitting an `UPDATE_MATCH` event again
			// wouldn't work for the second navigation
			// the way it worked for the initial one.
			//
			// The reason is that `found` router has a special case for handling
			// the "initial" `UPDATE_MATCH` event:
			//
			// https://github.com/4Catalyzer/found/blob/63a44a633159d6e16161e407fa4d6869fdb70623/src/foundReducer.ts
			//
			// switch (type) {
			//   case ActionTypes.UPDATE_MATCH:
			//     // For the initial match, set resolvedMatch too. There's no previous
			//     // result to keep rendered, plus this simplifies server rendering.
			//     return {
			//       match: payload,
			//       resolvedMatch: state ? state.resolvedMatch : payload
			//     }
			//   ...
			// }
			//
			// For that reason, first set `state.found.resolvedMatch` to `state.found.match`.
			//
			window._ReactPages_Navigation_IgnoreResolveMatchEvent = true
			store.dispatch({
				type: RESOLVE_MATCH,
				payload: store.getState().found.match
			})

			// Re-render.
			return setUpAndRender(settings, options)
		}
		throw error
	})
}