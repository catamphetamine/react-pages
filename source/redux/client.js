import React from 'react'
import ReactDOM from 'react-dom'

import Http_client from '../http client'
import localize_and_render from '../client'

import { render_on_client } from './render'
import create_store from './store'
import { normalize_common_options } from './normalize'
import set_up_http_client from './http client'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is what's gonna be called from the project's code on the client-side.
//
export default function render({ development, development_tools, load_translation }, common)
{
	common = normalize_common_options(common)

	// `http` utility can be used inside Redux action creators
	const http_client = new Http_client()

	// create ("rehydrate") Redux store
	const store = create_store(common.get_reducer,
	{
		development,
		development_tools,
		middleware           : common.redux_middleware,
		on_store_created     : common.on_store_created,
		promise_event_naming : common.promise_event_naming,
		on_preload_error     : common.on_preload_error,
		create_routes        : common.create_routes,
		data                 : window._flux_store_data,
		http_client
	})

	delete window._flux_store_data

	// Customization of `http` utility
	// which can be used inside Redux action creators
	set_up_http_client(http_client, { store, on_before_send: common.http_request })

	return localize_and_render
	({
		development,
		load_translation,
		wrapper: common.wrapper,
		render_on_client,
		render_parameters: { development_tools, create_routes: common.create_routes, store }
	})
}