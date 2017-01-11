import React from 'react'
import ReactDOM from 'react-dom'

import localize_and_render from '../../client'
import { authentication_token as get_authentication_token } from '../../client'
import render_on_client from './render'
import create_store from './create store'
import create_http_client from './create http client'
import normalize_common_settings from '../normalize'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is what's gonna be called from the project's code on the client-side.
//
export default function render(common, specific = {})
{
	common = normalize_common_settings(common)

	const { devtools, translation } = specific
	
	// camelCase aliasing
	const on_navigate = specific.on_navigate || specific.onNavigate

	// Read authentication token from a global variable
	// and also erase that global variable
	const authentication_token = get_authentication_token()

	// Create HTTP client (Redux action creator `http` utility)
	const http_client = create_http_client(common, authentication_token)

	// Create Redux store
	const store = create_store(common, window._store_data, http_client, devtools)
	delete window._store_data

	// Render page
	return localize_and_render
	({
		translation,
		wrapper: common.wrapper,
		render_on_client,
		render_parameters: { devtools, routes: common.routes, store, on_navigate }
	})
}