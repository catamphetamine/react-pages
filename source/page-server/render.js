// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'
import ReactDOM from 'react-dom/server'

// https://github.com/ReactTraining/react-router/issues/4023
// Also adds 'useBasename' and 'useQueries'
import createHistory from 'react-router/lib/createMemoryHistory'

import Html from './html'
import normalize_common_settings from '../redux/normalize'
import timer from '../timer'
import create_history from '../history'
import { location_url } from '../location'

import redux_render, { initialize as redux_initialize } from '../redux/server/server'
import { render_on_server as react_router_render } from '../react-router/render'

import { Preload } from '../redux/actions'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default async function(settings, { initialize, localize, assets, application, request, render, loading, html = {}, authentication, cookies })
{
	const path = get_path(request.url)

	settings = normalize_common_settings(settings)

	const
	{
		routes,
		wrapper
	}
	= settings

	const error_handler = settings.preload && settings.preload.catch

	// Read authentication token from a cookie (if configured)
	let authentication_token
	if (authentication && authentication.cookie)
	{
		authentication_token = cookies.get(authentication.cookie)
	}

	// Create `history` (`true` indicates server-side usage)
	const history = create_history(createHistory, request.url, settings.history, true)

	const initialize_timer = timer()

	// These `parameters` are used for `assets`, `html` modifiers
	// and also for `localize()` call.
	const initialize_result = await redux_initialize(settings,
	{
		authentication_token,
		application,
		request,
		initialize,
		history
	})

	const { extension_javascript, ...parameters } = initialize_result
	
	const initialize_time = initialize_timer()

	// `html` modifiers

	let { head } = html

	// camelCase support for those who prefer it
	let body_start = html.body_start || html.bodyStart
	let body_end   = html.body_end   || html.bodyEnd

	// Normalize `html` parameters
	head       = normalize_markup(typeof head       === 'function' ? head      (path, parameters) : head)
	body_start = normalize_markup(typeof body_start === 'function' ? body_start(path, parameters) : body_start)
	body_end   = normalize_markup(typeof body_end   === 'function' ? body_end  (path, parameters) : body_end)

	// Normalize assets

	assets = typeof assets === 'function' ? assets(path, parameters) : assets

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
		const result = localize(parameters)

		locale   = result.locale
		messages = result.messages

		// A tiny optimization to avoid calculating
		// `JSON.stringify(messages)` for each rendered page.
		messagesJSON = result.messagesJSON || JSON.stringify(messages)
	}

	// If Redux is being used, then render for Redux.
	// Else render for pure React.
	const render_page = redux_render

	try
	{
		// Render the web page
		const result = await render_page
		({
			...parameters,
			disable_server_side_rendering: render === false,
			history,
			routes,

			create_page_element: (child_element, props) => 
			{
				if (localize)
				{
					props.locale   = locale
					props.messages = messages
				}

				return React.createElement(wrapper, props, child_element)
			},

			render_webpage(content)
			{
				const markup = Html
				({
					...parameters,
					extension_javascript: typeof extension_javascript === 'function' ? extension_javascript() : extension_javascript,
					assets,
					locale,
					locale_messages_json: messagesJSON,
					head,
					body_start,
					body_end,
					authentication_token,
					content: render === false ? normalize_markup(loading) : (content && ReactDOM.renderToString(content))
				})

				return markup
			}
		})

		if (result.time)
		{
			result.time.initialize = initialize_time
		}

		return result
	}
	catch (error)
	{
		// Redirection is done via an Error on server side.
		// (e.g. if it happens in `onEnter()` during `match()`)
		if (error._redirect)
		{
			return { redirect: error._redirect }
		}

		if (!error_handler)
		{
			throw error
		}

		const result = {}

		const error_handler_parameters =
		{
			path,
			url      : request.url,
			redirect : to => result.redirect = to,
			server   : true
		}

		// Special case for Redux
		if (parameters.store)
		{
			error_handler_parameters.dispatch = redirecting_dispatch(parameters.store.dispatch, result)
			error_handler_parameters.getState = parameters.store.getState
		}

		// Strictly speaking, `preload.catch` is meant for `@preload()` helper,
		// but also using it here because in production it's better
		// to at least get the error logged and maybe also
		// handle it in a better way rather than just status 500 or status 403.
		try
		{
			error_handler(error, error_handler_parameters)
		}
		catch (error)
		{
			// Redirection is done via an Error on server side
			if (!error._redirect)
			{
				throw error
			}

			result.redirect = error._redirect
		}

		if (!result.redirect)
		{
			throw new Error(`"preload.catch" must either redirect to another URL or throw an error. ${request.url}`)
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

// Get path from a URL
function get_path(url)
{
	const search_start = url.indexOf('?')

	if (search_start !== -1)
	{
		url = url.slice(0, search_start)
	}

	const hash_start = url.indexOf('#')

	if (hash_start !== -1)
	{
		url = url.slice(0, hash_start)
	}

	return url
}

// A special flavour of `dispatch` which `throw`s for redirects on the server side.
function redirecting_dispatch(dispatch, result)
{
	return (event) =>
	{
		switch (event.type)
		{
			// In case of navigation from @preload()
			case Preload:
				// `throw`s a special `Error` on server side
				return result.redirect = location_url(event.location)
		
			default:
				// Proceed with the original
				return dispatch(event)
		}
	}
}