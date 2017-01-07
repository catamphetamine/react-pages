// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'
import ReactDOM from 'react-dom/server'

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
export default async function({ initialize, localize, assets, application, request, render, loading, html, authentication, cookies }, common)
{
	// Trims a question mark in the end (just in case)
	const url = request.url.replace(/\?$/, '')

	const
	{
		reducer,
		redux_middleware,
		on_store_created,
		promise_event_naming,
		routes,
		wrapper,
		parse_dates
	}
	= normalize_common_options(common)

	const error_handler = common.preload && common.preload.catch

	// Read authentication token from a cookie (if configured)
	let authentication_token
	if (authentication && authentication.cookie)
	{
		authentication_token = cookies.get(authentication.cookie)
	}

	// Isomorphic http client (with cookie support)
	const http_client = new Http_client
	({
		host          : application ? application.host : undefined,
		port          : application ? application.port : undefined,
		secure        : application ? application.secure : false,
		clone_request : request,
		format_url    : common.http && common.http.url,
		parse_dates,
		authentication_token,
		authentication_token_header: authentication ? authentication.header : undefined
	})

	// initial store data (if using Redux)
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
	if (reducer)
	{
		store = create_store(reducer,
		{
			server: true,
			routes,
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

	// If `html` is not set then don't throw an error
	html = html || {}

	let
	{
		head,
		style
	}
	= html

	// camelCase support for those who prefer it
	let body_start = html.body_start || html.bodyStart
	let body_end   = html.body_end   || html.bodyEnd

	const store_parameter = { store }

	// Normalize
	head       = normalize_markup(typeof head       === 'function' ? head      (url, store_parameter) : head)
	body_start = normalize_markup(typeof body_start === 'function' ? body_start(url, store_parameter) : body_start)
	body_end   = normalize_markup(typeof body_end   === 'function' ? body_end  (url, store_parameter) : body_end)

	// Normalize
	assets = typeof assets === 'function' ? assets(url, store_parameter) : assets

	if (assets.styles)
	{
		assets.style = assets.styles
	}

	// Internationalization

	let locale
	let messages
	let messagesJSON

	if (localize)
	{
		const result = localize(store)

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

			render_webpage: content =>
			{
				const markup = Html
				({
					assets,
					locale,
					locale_messages_json: messagesJSON,
					head,
					body_start,
					body_end,
					style,
					store,
					parse_dates,
					authentication_token,
					content: render === false ? normalize_markup(loading) : (content && ReactDOM.renderToString(content))
				})

				return markup
			},

			store,
			routes
		})

		if (result.time)
		{
			result.time.initialize = initialize_time
		}

		return result
	}
	catch (error)
	{
		if (!error_handler)
		{
			throw error
		}

		const result = {}

		error_handler(error,
		{
			url,
			redirect : to => result.redirect = to,

			dispatch : store.dispatch,
			getState : store.getState
		})

		if (!result.redirect)
		{
			throw new Error('Preload error handler must either redirect to a URL or throw an error')
		}

		return result
	}
}

// Converts React.Elements to Strings
function normalize_markup(anything)
{
	if (!anything)
	{
		return ''
	}

	if (typeof anything === 'function')
	{
		return anything
	}

	if (typeof anything === 'string')
	{
		return anything
	}

	if (Array.isArray(anything))
	{
		return anything.map(normalize_markup).join('')
	}

	return ReactDOM.renderToString(anything)
}