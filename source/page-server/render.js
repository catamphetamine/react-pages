// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'

import Html from './html'
import Http_client from '../http client'

import redux_render                                from '../redux/server/render'
import { render_on_server as react_router_render } from '../react-router/render'

import create_store from '../redux/server/store'
import set_up_http_client from '../redux/http client'

import { normalize_common_options } from '../redux/normalize'

import timer from '../timer'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default async function({ preload, initialize, localize, assets, application, request, render, loading, html, authentication, error_handler, cookies }, common)
{
	// Trims a question mark in the end (just in case)
	const url = request.url.replace(/\?$/, '')

	const
	{
		get_reducer,
		redux_middleware,
		on_store_created,
		promise_event_naming,
		create_routes,
		wrapper,
		parse_dates
	}
	= normalize_common_options(common)

	// Legacy 7.x API support.
	// (will be removed later)
	error_handler = error_handler || (common.preload && common.preload.catch)
	// const error_handler = common.preload && common.preload.catch

	// Legacy 7.x API support.
	// (will be removed later)
	initialize = initialize || preload

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

	// Make `assets` into a function
	assets = normalize_assets(assets)

	// In development mode Redux DevTools are activated, for example
	const development = process.env.NODE_ENV !== 'production'

	// Read authentication token from a cookie (if configured)
	let authentication_token
	if (authentication && authentication.cookie)
	{
		authentication_token = cookies.get(authentication.cookie)
	}

	// Isomorphic http client (with cookie support)
	const http_client = new Http_client
	({
		host          : application.host,
		port          : application.port,
		secure        : application.secure,
		clone_request : request,
		format_url    : common.http && common.http.url,
		parse_dates,
		authentication_token,
		authentication_token_header: authentication ? authentication.header : undefined
	})

	// initial Flux store data (if using Flux)
	let store_data = {}

	let initialize_time = 0

	// supports custom preloading before the page is rendered
	// (for example to authenticate the user and retrieve user selected language)
	if (initialize)
	{
		const initialize_timer = timer()
		store_data = await initialize(http_client, { request })
		initialize_time = initialize_timer()
	}

	let store

	// create Redux store
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
			promise_event_naming,
			on_preload_error : common.preload && common.preload.catch,
			http_client,
			preload_helpers : common.preload && common.preload.helpers,
			on_navigate     : common.on_navigate,
			history_options : common.history
		})
	}

	// Customization of `http` utility
	// which can be used inside Redux action creators
	set_up_http_client(http_client,
	{
		store,
		on_before_send : common.http && common.http.request
	})

	// Internationalization

	let locale
	let messages
	let messagesJSON

	if (localize)
	{
		let result = localize(store)

		// Legacy support for `async` `localize`
		// (may be removed in versions > `7.x`)
		if (typeof result.then === 'function')
		{
			result = await result
		}

		locale   = result.locale
		messages = result.messages

		// A tiny optimization to avoid calculating
		// `JSON.stringify(messages)` for each rendered page.
		messagesJSON = result.messagesJSON || JSON.stringify(messages)
	}

	// If Redux is being used, then render for Redux.
	// Else render for pure React.
	const render_page = store ? redux_render : react_router_render

	try
	{
		// Render the web page
		const result = await render_page
		({
			disable_server_side_rendering: render === false,
			
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
				assets = assets(url, { store })
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
						locale_messages_json={messagesJSON}
						head={head}
						body={body}
						body_start={body_start}
						body_end={body_end}
						style={style}
						store={store}
						parse_dates={parse_dates}
						authentication_token={authentication_token}>

						{render === false ? loading : content}
					</Html>
				)

				return markup
			},

			store,

			// create_routes is only used for bare React-router rendering
			create_routes: store ? undefined : create_routes
		})

		if (result.time)
		{
			result.time.initialize = initialize_time
		}

		return result
	}
	catch (error)
	{
		if (error_handler)
		{
			return error_handler(error,
			{
				url,
				redirect : to => request.redirect(to),

				dispatch : store ? store.dispatch : undefined,
				getState : store ? store.getState : undefined
			})
		}

		throw error
	}
}

// Makes it a function
function normalize_assets(assets)
{
	// Normalize `assets` parameter
	// (to be a function)
	if (typeof assets !== 'function')
	{
		const assets_object = assets
		assets = () => assets_object
	}

	return assets
}