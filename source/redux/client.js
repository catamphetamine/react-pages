import React from 'react'
import ReactDOM from 'react-dom'

import { render_on_client } from './render'

import http_client from '../http client'

import localize_and_render from '../client'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is what's gonna be called from the project's code on the client-side.
//
export default function render({ development, development_tools, create_store, create_routes, markup_wrapper, load_localized_messages })
{
	// create ("rehydrate") Redux store
	const store = create_store
	({
		development,
		development_tools,
		create_routes,
		data: window._flux_store_data,
		http_client: new http_client()
	})
	
	delete window._flux_store_data

	return localize_and_render
	({
		development,
		load_localized_messages,
		markup_wrapper,
		render_on_client,
		render_parameters: { development_tools, create_routes, store }
	})
}