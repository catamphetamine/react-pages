import React from 'react'
import ReactDOM from 'react-dom'

import client_side_render from '../../client/render'
import create_history, { should_instrument_history_pop_state_listeners } from '../../client/history'
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

	const { devtools, translation, stats } = options
	
	// camelCase aliasing
	const on_navigate = options.on_navigate || options.onNavigate

	// Redux store (is used in history `popstate` listener)
	let store

	// Create HTTP client (Redux action creator `http` utility)
	const http_client = create_http_client(settings, () => store, window._protected_cookie_value)
	// E.g. for WebSocket message handlers, since they only run on the client side.
	window._react_isomorphic_render_http_client = http_client

	// Reset "instant back" on page reload
	// since Redux state is cleared.
	reset_instant_back()

	// Will intercept `popstate` DOM event to preload pages before showing them.
	// This hook is placed before `history` is initialized because it taps on `popstate`.
	should_instrument_history_pop_state_listeners((listener, event, location) =>
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
		if (is_instant_transition(from_location, to_location))
		{
			// Navigate to the page without preloading it
			// (has been previously preloaded and is in Redux state)
			return listener(event)
		}

		// Preload the page but don't navigate to it just yet
		store.dispatch(start_preload(location, undefined, false)).then((result) =>
		{
			// Navigate to the page
			listener(event)
		},
		(error) =>
		{
			// Log the error
			console.error(error)
		})
	})

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
		on_navigate
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
	if (options.onStoreCreated)
	{
		options.onStoreCreated(store)
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
	
	history.listen((location) =>
	{
		current_location = location
	})

	// Call `onNavigate` on initial page load
	if (on_navigate)
	{
		on_navigate(location_url(current_location), current_location)
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
		return store.dispatch(start_preload(current_location, undefined, false, true)).then(() => result)
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

// Returns `http` utility on the client side.
// Can be used in WebSocket message handlers,
// since they only run on the client side.
export function getHttpClient()
{
	return window._react_isomorphic_render_http_client
}