import clientSideRender from '../../client/render.js'
import { isServerSideLoaded } from '../../client/flags.js'
import { getMatch, redirect, RESOLVE_MATCH, _RESOLVE_MATCH, UNLISTEN_BROWSER_HISTORY_EVENTS, pushLocation, RedirectException } from '../../router/index.js'
import { onFoundRouterReady } from './router.js'
import normalizeSettings from '../normalize.js'
import render from './render.js'
import createStore from './createStore.js'
import { resetInstantNavigationChain } from './instantNavigation.js'
import showInitialLoad from './initialLoad/showInitialLoad.js'
import hideInitialLoad from './initialLoad/hideInitialLoad.js'

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
// then the library would first execute all client-side `load`s
// and only then would it render the application.
// That would be more intuitive and convenient for developers I guess.
//
export default function setUpAndRender_(settings, options) {
	return setUpAndRender(settings, options, { redirectException: undefined })
}

function setUpAndRender(settings, options, { redirectException }) {
	settings = normalizeSettings(settings)

	// Reset "instant back" on page reload
	// since Redux state is cleared.
	// "instant back" chain is stored in `window.sessionStorage`
	// and therefore it survives page reload.
	resetInstantNavigationChain()

	// The first pass of initial client-side render
	// is to render the markup which matches server-side one.
	// The second pass will be to render after resolving `getData`.
	if (isServerSideLoaded()) {
		window._ReactPages_Page_ServerSideRenderedPageRestorationPrerender = true
		window._ReactPages_Page_SkipDataLoad = true
	}

	// Create a Redux store (and, internally, an HTTP client).
	// Mutate `settings` because they're passed again "recursively"
	// in a `catch` clause below.
	const store = createStore(settings, options)

	// Getting the `store` as soon as it has been created was a feature in
	// early versions of this library.
	// Acadeum Course Share website still uses it, so it hasn't been removed.
	if (options.onStoreCreated) {
		options.onStoreCreated(store)
	}

	const {
		InitialLoadComponent,
		initialLoadShowDelay,
		initialLoadHideAnimationDuration
	} = settings

	const shouldShowInitialLoad = Boolean(InitialLoadComponent) && !isServerSideLoaded()

	// Render loading indicator in case of client-side-only rendering
	// because the main application React tree won't be rendered
	// until `load`s finish.
	if (shouldShowInitialLoad) {
		showInitialLoad({
			Component: InitialLoadComponent,
			showDelay: initialLoadShowDelay,
			hideAnimationDuration: initialLoadHideAnimationDuration
		})
	}

	const onSuccess = (result) => {
		// Hide the "initial" loading indicator.
		if (shouldShowInitialLoad) {
			hideInitialLoad()
		}

		// Perform the second pass of initial client-side rendering.
		// The second pass resolves `getData` on routes.
		// (which means it resolves all client-side `load`s)
		if (isServerSideLoaded()) {
			store.dispatch(redirect(document.location))
		} else {
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
	}

	const onError = (error) => {
		// Hide the "initial" loading indicator.
		if (shouldShowInitialLoad) {
			hideInitialLoad()
		}

		// Catches redirects from:
		// * `RedirectExpections` thrown from `route.Component.load()`
		// * `RedirectExpections` thrown from `settings.onLoadError()`
		// * `RedirectExpections` thrown from `permanentRedirectTo` routes
		//
		// The `!redirectException` condition prevents infinite loops of
		// redirecting to an `/error` page.
		//
		if ((error instanceof RedirectException) && !redirectException) {
			const redirectStatusCode = error.status

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
			// Emits an `UPDATE_MATCH` event.
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
			// For that reason, first set `state.found.resolvedMatch` to `state.found.match`
			// by emitting a `RESOLVE_MATCH` event, and only after that emit a new `UPDATE_MATCH` event
			// to run a new navigation cycle.
			//
			window._ReactPages_Navigation_IgnoreResolveMatchEvent = true
			store.dispatch({
				type: RESOLVE_MATCH,
				payload: getMatch(store.getState())
			})

			// Remove `popstate` window event listener that was set up
			// by `farce`'s `historyMiddleware` when it was created.
			// The `store` will be re-created from scratch for a re-render,
			// and any window history listeners will be set up again.
			// Without this removal, two listeners would respond to window's
			// `popstate` events.
			store.dispatch({
				type: UNLISTEN_BROWSER_HISTORY_EVENTS
			})

			// `farce`'s `scroll-behavior` also sets up a listener
			// for window's `beforeunload` event, but it does so
			// in `componentDidMount()` (or `useEffect()`, when rewritten in effects)
			// of `found-scroll/ScrollManager.js`.
			//
			// `componentDidMount()` (or `useEffect()`, when rewritten in effects)
			// only gets called after the component got rendered, and `onError`
			// is only called when `<Router/>` didn't get rendered due to an error,
			// so there's no need to unlisten window's `beforeunload` event
			// because that listener hasn't been set up yet.

			// If an error happens inside `clientSideRender()`
			// then the `<Router/>` element won't be mounted on the page.
			// Because of that, if `clientSideRender()` redirected to an error page
			// in case of an error, the error page wouldn't be rendered and there'd be a blank screen.
			// To work around that, in case of an error, the whole rendering framework
			// is recreated and restarted from scratch, and then it renders the error page.
			return setUpAndRender(settings, options, { redirectException: error })
		}

		throw error
	}

	function finishWith(func) {
		// If the `<Router/>` element has been rendered,
		// it must wait for its `componentDidMount()` to be called first
		// in order to proceed on doing anything else
		// because otherwise the router is disfunctional within the timeframe
		// starting from `render()` and ending with `componentDidMount()`.
		// `onFoundRouterReady()` function was created to skip that timeframe.
		// See `componentDidMount()` in `found/src/createBaseRouter.tsx` for the implementation.
		if (window._ReactPages_HasBeenRendered) {
			return onFoundRouterReady(() => {
				return func()
			})
		} else {
			return func()
		}
	}

	// Render the page.
	// If it's a server-side rendering case then that will be the
	// first pass, without loading data, just for `React.hydrate()`.
	// If it's a client-side rendering case then that will be the
	// first pass with loading data.

	return clientSideRender({
		rootComponent: settings.rootComponent,
		render,
		renderParameters: {
			store
		}
	}).then(
		// If there was no error then `<Router/>` has been rendered.
		(result) => finishWith(() => onSuccess(result)),
		// If there was an error then `<Router/>` hasn't been rendered.
		(error) => finishWith(() => onError(error))
	)
}