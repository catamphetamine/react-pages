import React from 'react'
import ReactDOM from 'react-dom'

import Http_client from '../../http client'
import localize_and_render from '../../client'

import render_on_client from './render'
import create_store from './store'
import { normalize_common_options } from '../normalize'
import set_up_http_client from '../http client'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is what's gonna be called from the project's code on the client-side.
//
export default function render({ development, development_tools, translation }, common)
{
	common = normalize_common_options(common)

	// `http` utility can be used inside Redux action creators
	const http_client = new Http_client
	({
		format_url : common.http && common.http.url
	})

	// create ("rehydrate") Redux store
	const store = create_store(common.get_reducer,
	{
		development,
		development_tools,
		middleware           : common.redux_middleware,
		on_store_created     : common.on_store_created,
		promise_event_naming : common.promise_event_naming,
		on_preload_error     : common.preload && common.preload.catch,
		preload_helpers      : common.preload && common.preload.helpers,
		create_routes        : common.create_routes,
		on_navigate          : common.on_navigate,
		history_options      : common.history,
		data                 : window._flux_store_data,
		http_client
	})

	delete window._flux_store_data

	// Customization of `http` utility
	// which can be used inside Redux action creators
	set_up_http_client(http_client,
	{
		store,
		on_before_send : common.http && common.http.request
	})

	return localize_and_render
	({
		development,
		translation,
		wrapper: common.wrapper,
		render_on_client,
		render_parameters: { development_tools, create_routes: common.create_routes, store }
	})
}