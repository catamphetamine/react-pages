import React from 'react'
import ReactDOM from 'react-dom'

import client_side_render, { create_history, authentication_token as get_authentication_token } from '../../client'
import render from './render'
import create_store from './create store'
import create_http_client from './create http client'
import normalize_common_settings from '../normalize'

// This function is what's gonna be called from the project's code on the client-side.
export default function set_up_and_render(settings, options = {})
{
	settings = normalize_common_settings(settings)

	const { devtools, translation } = options
	
	// camelCase aliasing
	const on_navigate = options.on_navigate || options.onNavigate

	// Read authentication token from a global variable
	// and also erase that global variable
	const authentication_token = get_authentication_token()

	// Create HTTP client (Redux action creator `http` utility)
	const http_client = create_http_client(settings, authentication_token)

	// Create `react-router` `history`
	const history = create_history(document.location, settings)

	// Create Redux store
	const store = create_store(settings, window._redux_state, history, http_client, devtools)
	delete window._redux_state

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
			devtools,
			on_navigate
		}
	})
}