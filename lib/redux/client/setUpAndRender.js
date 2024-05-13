import clientSideRender from '../../client/render.js'
import { isServerSideLoaded } from '../../client/flags.js'
import { redirect, RESOLVE_MATCH, _RESOLVE_MATCH, UNLISTEN_BROWSER_HISTORY_EVENTS, goto } from '../../router/actions.js'
import { getMatch, RedirectException } from '../../router/index.js'
import { onFoundRouterReady } from './router.js'
import normalizeSettings from '../normalize.js'
import Stash from '../Stash.js'
import render from './render.js'
import createStore from './createStore.js'
import { resetInstantNavigationChain } from './instantNavigation.js'
import showInitialLoad from './initialLoad/showInitialLoad.js'
import hideInitialLoad from './initialLoad/hideInitialLoad.js'
import { getFromContext, setInContext, takeFromContext, clearInContext, clearAllInContextExcept } from '../../context.js'

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
	if (window._ReactPages_InitialPage_ReloadDataOnClientRender) {
		setInContext('InitialPage/RepeatLoadOnClientSideRender', true)
		delete window._ReactPages_InitialPage_ReloadDataOnClientRender
	}

	if (window._ReactPages_ReduxStateServerSideSnapshot) {
		setInContext('App/ReduxStateServerSideSnapshot', window._ReactPages_ReduxStateServerSideSnapshot)
		delete window._ReactPages_ReduxStateServerSideSnapshot
	}

	if (window._ReactPages_ServerSideRendered) {
		setInContext('InitialPage/ServerSideRendered', true)
		delete window._ReactPages_ServerSideRendered
	}

	if (window._ReactPages_ServerSideRenderedEmpty) {
		setInContext('InitialPage/ServerSideRenderedEmpty', true)
		delete window._ReactPages_ServerSideRenderedEmpty
	}

	if (window._ReactPages_Locales) {
		setInContext('App/Locales', window._ReactPages_Locales)
		delete window._ReactPages_Locales
	}

	// Create utility data stash.
	//
	// If `setUpAndRender()` is called second time after the first one resulted in an error,
	// the `stash` data from first one will be reused in the second one
	// because it contains the `props` returned from `.load()` function of the root route component.
	// Otherwise, the root route component wouldn't receive those props after `setUpAndRender()`.
	//
	const stash = new Stash()

	return setUpAndRender(settings, options, { redirectException: undefined, stash })
}

function setUpAndRender(settings, options, { redirectException, stash }) {
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
		setInContext('InitialPage/RepeatingServerSideRenderOnClientSide', true)
		setInContext('InitialPage/SkipLoad', true)
	}

	// Create a Redux store (and, internally, an HTTP client).
	// Mutate `settings` because they're passed again "recursively"
	// in a `catch` clause below.
	const store = createStore(settings, options, { stash })

	// `onStoreCreated` listener allows the application to get access
	// to the `store` as soon as it has been created.
	//
	// What could it be used for?
	//
	// * Acadeum Course Share client-side-only website uses it to
	//   pre-"bind" all "action creators" to the newly created `store`,
	//   so that later it could call them without `dispatch()`:
	//   just `action()` instead of `dispatch(action())`.
	//   It's not necessarily a recommended approach. More like the opposite,
	//   due to it being unconventional. But Acadeum's website has already
	//   been written that way, so why rewrite it when it works.
	//
	// So seems like this `onStoreCreated()` function is a legacy one
	// that is currently only used at Acadeum.
	//
	if (options && options.onStoreCreated) {
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
		// `ReduxStateServerSideSnapshot` data may be reused in a second `setUpAndRender()`
		// if the first one throws an error, so it's cleared here, after a `setUpAndRender()`
		// has finished rendering the app, and also it's stored under `App/` namespace
		// rather than `InitialPage/` namespace for the same reason.
		clearInContext('App/ReduxStateServerSideSnapshot')

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
			// * With server-side rendering enabled
			//   initially there are two rendering passes
			//   and therefore `RESOLVE_MATCH` does get dispatched
			//   after the page is initialized and rendered.
			// * With server-side rendering disabled
			//   `RESOLVE_MATCH` does not get dispatched
			//   therefore a custom ("fake") `_RESOLVE_MATCH` event
			//   should be dispatched manually.
			const eventPayload = takeFromContext('InitialPage/FakeResolveMatchEventPayload')
			store.dispatch({
				type: _RESOLVE_MATCH,
				payload: eventPayload
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
			// `error.location` is gonna be the `location` it redirects to.
			// If the route wasn't found then `error.location` is `undefined`.
			if (!error.location) {
				const error = new Error('Not found')
				error.status = 404
				throw error
			}

			const redirectStatusCode = error.status

			// Reset all `react-pages` flags related to:
			// * the current page properties.
			// * the current navigation properties.
			// * the navigation chain so far.
			clearAllInContextExcept('App/')

			// Change current location.
			// Emits an `UPDATE_MATCH` event.
			// `error.location` can be a `string`.
			// Maybe it could be a location `object` too.
			//
			// `dispatch(goto())` is used here instead of just `dispatch(pushLocation())`
			// in order to not skip calling the `.load()` function the new page.
			//
			store.dispatch(goto(error.location))

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
			setInContext('Navigation/IgnoreResolveMatchRouterEvent', true)
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
			return setUpAndRender(settings, options, { redirectException: error, stash })
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
		if (getFromContext('App/HasBeenRendered')) {
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