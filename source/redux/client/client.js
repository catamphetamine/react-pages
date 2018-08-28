import React from 'react'
import ReactDOM from 'react-dom'

import clientSideRender from '../../client/render'
import render from './render'
import createHttpClient from '../HttpClient'
import normalizeSettings from '../normalize'
import createStore from '../store'
import { resetInstantBack } from './instantBack'
import { getLocationUrl } from '../../location'
import { convertRoutes } from '../../router'
import { createHistoryProtocol } from '../../router/client'

// This function is what's gonna be called from the project's code on the client-side.
export default function setUpAndRender(settings, options = {}) {

	settings = normalizeSettings(settings)

	const {
		devtools,
		stats,
		onNavigate,
		onStoreCreated
	} = options

	// Redux store.
	let store

	// Create HTTP client (Redux action creator `http` utility)
	const httpClient = createHttpClient(settings, () => store, window._protected_cookie_value)
	// E.g. for WebSocket message handlers, since they only run on the client side.
	window._react_website_http_client = httpClient

	// Reset "instant back" on page reload
	// since Redux state is cleared.
	// "instant back" chain is stored in `window.sessionStorage`
	// and therefore it survives page reload.
	resetInstantBack()

	// Create Redux store
	store = createStore(settings, getState(true), createHistoryProtocol, httpClient, {
		devtools,
		stats,
		onNavigate
	})

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

	// Render the page
	return clientSideRender({
		container: settings.container,
		render,
		renderParameters: {
			store
		}
	})
}

// Gets Redux store state before "rehydration".
// In case someone needs to somehow modify
// Redux state before client-side render.
// (because the variable could be potentially renamed in future)
export function getState(erase) {
	const state = window._redux_state
	if (erase) {
		delete window._redux_state
	}
	return state
}

// Returns `http` utility on client side.
// Can be used in WebSocket message handlers,
// since they only run on the client side.
export function getHttpClient() {
	return window._react_website_http_client
}