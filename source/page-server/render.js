// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'

import fs from 'fs'

import Html from './html'
import Http_client from '../http client'

import { render_on_server as redux_render }        from '../redux/render'
import { render_on_server as react_router_render } from '../react-router/render'

import create_store from '../redux/store'
import set_up_http_client from '../redux/http client'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default async function({ preload, localize, assets, application, request, disable_server_side_rendering, html }, common)
{
	const
	{
		get_reducer,
		redux_middleware,
		on_store_created,
		on_preload_error,
		create_routes,
		wrapper
	}
	= common

	let
	{
		head,
		body,
		body_start,
		body_end,
		style
	}
	= html

	if (style)
	{
		console.warn(`"html.style" parameter is deprecated and will be removed in the next major release. Use "html.head" instead: if (development) return [<style dangerouslySetInnerHTML={{ __html: style }} charSet="UTF-8"/>, ...]`)
	}

	// In development mode Redux DevTools are activated, for example
	const development = process.env.NODE_ENV !== 'production'

	// Trims a question mark in the end (just in case)
	const url = request.url.replace(/\?$/, '')

	// Isomorphic http client (with cookie support)
	const http_client = new Http_client
	({
		host          : application.host,
		port          : application.port,
		secure        : application.secure,
		clone_request : request
	})

	// initial Flux store data (if using Flux)
	let store_data = {}

	// supports custom preloading before the page is rendered
	// (for example to authenticate the user and retrieve user selected language)
	if (preload)
	{
		store_data = (await preload(http_client, { request })) || store_data
	}

	// create Redux store
	let store
	if (get_reducer)
	{
		store = create_store(get_reducer,
		{
			development,
			server: true,
			create_routes,
			data: store_data,
			middleware: redux_middleware,
			on_store_created,
			on_preload_error,
			http_client
		})
	}

	// Customization of `http` utility
	// which can be used inside Redux action creators
	set_up_http_client(http_client, { store, on_before_send: common.http_request })

	// Internationalization

	let locale
	let messages

	if (localize)
	{
		const result = await localize(store)

		locale   = result.locale
		messages = result.messages
	}

	// If Redux is being used, then render for Redux.
	// Else render for pure React.
	const render = store ? redux_render : react_router_render

	// Render the web page
	return await render
	({
		disable_server_side_rendering,
		
		url,

		create_page_element: (child_element, props) => 
		{
			if (localize)
			{
				props.locale   = locale
				props.messages = messages
			}

			return React.createElement(wrapper, props, child_element)
		},

		render_webpage_as_react_element: content =>
		{
			assets = assets(url)
			if (assets.styles)
			{
				assets.style = assets.styles
			}

			if (head)
			{
				head = head(url)
			}

			if (body_start)
			{
				body_start = body_start(url)
			}

			if (body_end)
			{
				body_end = body_end(url)
			}

			const markup = 
			(
				<Html
					development={development}
					assets={assets}
					locale={locale}
					head={head}
					body={body}
					body_start={body_start}
					body_end={body_end}
					style={style}
					store={store}>

					{content}
				</Html>
			)

			return markup
		},

		store,

		// create_routes is only used for bare React-router rendering
		create_routes: store ? undefined : create_routes
	})
}