// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'
import ReactDOM from 'react-dom/server'

import Html from './html'
import redux_render from '../redux/server/render'
import { render_on_server as react_router_render } from '../react-router/render'
import create_store from '../redux/server/create store'
import create_http_client from '../redux/server/create http client'
import normalize_common_settings from '../redux/normalize'
import timer from '../timer'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default async function(common, { initialize, localize, assets, application, request, render, loading, html, authentication, cookies })
{
	// Trims a question mark in the end (just in case)
	const url = request.url.replace(/\?$/, '')

	common = normalize_common_settings(common)

	const
	{
		routes,
		wrapper,
		parse_dates
	}
	= normalize_common_settings(common)

	const error_handler = common.preload && common.preload.catch

	// Read authentication token from a cookie (if configured)
	let authentication_token
	if (authentication && authentication.cookie)
	{
		authentication_token = cookies.get(authentication.cookie)
	}

	// Create Redux store

	// Create HTTP client (Redux action creator `http` utility)
	const http_client = create_http_client(common, authentication_token, application, request)

	// Initial store data
	let store_data = {}

	// Time to fetch initial store data
	let initialize_time = 0

	// Supports custom preloading before the page is rendered
	// (for example to authenticate the user and retrieve user selected language)
	if (initialize)
	{
		const initialize_timer = timer()
		store_data = await initialize(http_client, { request })
		initialize_time = initialize_timer()
	}

	// Create Redux store
	const store = create_store(common, store_data, http_client)

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

	// Normalize `html` parameters
	head       = normalize_markup(typeof head       === 'function' ? head      (url, store_parameter) : head)
	body_start = normalize_markup(typeof body_start === 'function' ? body_start(url, store_parameter) : body_start)
	body_end   = normalize_markup(typeof body_end   === 'function' ? body_end  (url, store_parameter) : body_end)

	// Normalize assets

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