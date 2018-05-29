import React from 'react'
import ReactDOM from 'react-dom'

import client_side_render from '../../client/render'
import create_history, { should_instrument_new_popstate_listeners, should_not_instrument_new_popstate_listeners } from '../../client/history'
import render from './render'
import create_http_client from '../http client'
import normalize_common_settings from '../normalize'
import create_store from '../store'
import { start_preload } from '../preload/actions'
// import { load_state_action } from '../actions'
import { is_instant_transition, reset_instant_back } from './instant back'
import { location_url } from '../../location'

// This function is what's gonna be called from the project's code on the client-side.
export default function set_up_and_render(settings, options = {})
{
	settings = normalize_common_settings(settings)

	const
	{
		devtools,
		translation,
		stats,
		onNavigate,
		onStoreCreated
	}
	= options

	// Redux store (is used in history `popstate` listener)
	let store

	// Create HTTP client (Redux action creator `http` utility)
	const http_client = create_http_client(settings, () => store, window._protected_cookie_value)
	// E.g. for WebSocket message handlers, since they only run on the client side.
	window._react_isomorphic_render_http_client = http_client

	// Reset "instant back" on page reload
	// since Redux state is cleared.
	// "instant back" chain is stored in `window.sessionStorage`
	// and therefore it survives page reload.
	reset_instant_back()

	// `history` is created after the `store`.
	// At the same time, `store` needs the `history` later during navigation.
	// And `history` might need store for things like `react-router-redux`.
	// Hence the getter instead of a simple variable
	let history
	const get_history = () => history

	// Create Redux store
	store = create_store(settings, getState(true), get_history, http_client,
	{
		devtools,
		stats,
		onNavigate
	})

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
	if (onStoreCreated)
	{
		onStoreCreated(store)
	}

	// Create `react-router` `history`
	history = create_history(document.location, settings.history, { store })

	// When `popstate` event listener is fired,
	// `history.getCurrentLocation()` is already
	// the `pop`ped one (for some unknown reason),
	// therefore the "previous location" could be obtained
	// using this listener.

	let current_location = history.getCurrentLocation()
	const get_current_location = () => current_location

	// Will intercept `popstate` DOM event to preload pages before showing them.
	// This hook is placed before `history` is initialized because it taps on `popstate`.
	should_instrument_new_popstate_listeners((listener, event, location) =>
	{
		// This idea was discarded because state JSON could be very large.
		// // Store the current Redux state in history
		// // before performing the "Back"/"Forward" navigation.
		// store_in_history('redux/state', get_current_location().key, store.getState())
		//
		// const redux_state = get_from_history('redux/state', event.state.key)
		//
		// if (redux_state)
		// {
		// 	// Won't preload the page again but will instead use
		// 	// the Redux state that was relevant at the time
		// 	// the page was navigated from.
		// 	store.dispatch(load_state_action(redux_state))
		//
		// 	// Navigate to the page
		// 	listener(event)
		// 	return
		// }

		// "from location" means before the `popstate` transition.
		const from_location = get_current_location()
		const to_location   = { key: event.state ? event.state.key : undefined }

		// If it's an instant "Back"/"Forward" navigation
		// then navigate to the page without preloading it.
		// (has been previously preloaded and is in Redux state)
		const instant = is_instant_transition(from_location, to_location)

		// Preload the page but don't navigate to it just yet.
		store.dispatch(start_preload(location,
		{
			navigate : false,
			instant
		}))
		.then
		(
			() =>
			{
				// Set the flag for `wasInstantNavigation()`.
				window._react_isomorphic_render_was_instant_navigation = instant
				// Navigate to the page.
				listener(event)
			},
			// Log the error
			(error) => console.error(error)
		)
	})

	// Listen to `pushstate`/`popstate` events.
	history.listen((location) => current_location = location)

	// `history` added its `popstate` listener and it has been instrumented.
	// Don't instrument any other `popstate` listeners.
	should_not_instrument_new_popstate_listeners()

	// Call `onNavigate` on initial page load
	if (onNavigate)
	{
		onNavigate(location_url(current_location), current_location)
	}

	// Render the page
	return client_side_render
	({
		translation,
		container: settings.container,
		render,
		render_parameters:
		{
			history,
			routes: settings.routes,
			store
		}
	})
	.then((result) =>
	{
		// Execute all client-side-only `@preload()`s.
		return store.dispatch(start_preload(current_location, { navigate: false, initialClientSidePreload: true })).then(() => result)
	})
}

// Gets Redux store state before "rehydration".
// In case someone needs to somehow modify
// Redux state before client-side render.
// (because the variable could be potentially renamed in future)
export function getState(erase)
{
	const state = window._redux_state

	if (erase)
	{
		delete window._redux_state
	}

	return state
}

// Returns `http` utility on client side.
// Can be used in WebSocket message handlers,
// since they only run on the client side.
export function getHttpClient()
{
	return window._react_isomorphic_render_http_client
}

// Returns `http` utility on client side.
// Can be used to find out if the current page
// transition was an "instant" one.
// E.g. an Algolia "Instant Search" component
// could reset the stored cached `resultsState`
// if the transition was not an "instant" one.
export function wasInstantNavigation()
{
	return typeof window !== 'undefined' && window._react_isomorphic_render_was_instant_navigation === true
}