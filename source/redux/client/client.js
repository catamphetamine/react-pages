import React from 'react'
import ReactDOM from 'react-dom'

import client_side_render, { always_instrument_history_pop_state_listeners, create_history, authentication_token } from '../../client'
import render from './render'
import { create_http_client } from '../http client'
import normalize_common_settings from '../normalize'
import create_store from '../store'
import { preload_action } from '../actions'

// This function is what's gonna be called from the project's code on the client-side.
export default function set_up_and_render(settings, options = {})
{
	settings = normalize_common_settings(settings)

	const { devtools, translation, stats } = options
	
	// camelCase aliasing
	const on_navigate = options.on_navigate || options.onNavigate

	// Create HTTP client (Redux action creator `http` utility)
	const http_client = create_http_client(settings, authentication_token())

	// Redux store (is used in history `popstate` listener)
	let store

	// Intercept `popstate` DOM event to preload pages before showing them
	always_instrument_history_pop_state_listeners((listener, event, location) =>
	{
		// Preload the page but don't navigate to it
		store.dispatch(preload_action(location, undefined, false)).then((result) =>
		{
			// If preload was cancelled, then don't call the wrapped listener
			if (result === false)
			{
				return
			}

			listener(event)
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

	// Create `react-router` `history`
	history = create_history(document.location, settings.history, { store })

	// Call `onNavigate` on initial page load
	if (on_navigate)
	{
		on_navigate(window.location.pathname + (window.location.search ? window.location.search : ''))
	}

	// Render the page
	return client_side_render
	({
		translation,
		wrapper: settings.wrapper,
		render,
		render_parameters:
		{
			history,
			routes: settings.routes,
			store,
			devtools
		}
	})
	.then((result) =>
	{
		// Execute all client-side-only `@preload()`s.
		return store.dispatch(preload_action(window.location, undefined, false, true)).then(() => result)
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