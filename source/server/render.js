// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'
import ReactDOM from 'react-dom/server'

import string_stream from 'string-to-stream'
import multi_stream from 'multistream'

import { render_before_content, render_after_content } from './html'
import normalize_common_settings from '../redux/normalize'
import timer from '../timer'
import create_history from './history'
import { location_url, parse_location } from '../location'

import redux_render, { initialize as redux_initialize } from '../redux/server/server'
import { render_on_server as react_router_render } from '../react-router/render'

import { Preload } from '../redux/actions'
import { meta_tags } from '../meta'

export default async function render_page(settings, { initialize, localize, assets, proxy, url, hollow, html = {}, cookies, beforeRender })
{
	settings = normalize_common_settings(settings)

	const
	{
		routes,
		container,
		authentication
	}
	= settings

	const error_handler = settings.error

	// If Redux is being used, then render for Redux.
	// Else render for pure React.
	const render_page = redux_render

	// Read protected cookie value (if configured)
	let protected_cookie_value
	if (authentication && authentication.protectedCookie)
	{
		protected_cookie_value = cookies.get(authentication.protectedCookie)
	}

	// `history` is created after the `store`.
	// At the same time, `store` needs the `history` later during navigation.
	// And `history` might need store for things like `react-router-redux`.
	// Hence the getter instead of a simple variable
	let history
	const get_history = () => history

	const initialize_timer = timer()

	// `parameters` are used for `assets`, `html` modifiers and also for `localize()` call.
	const { extension_javascript, afterwards, ...parameters } = await redux_initialize(settings,
	{
		protected_cookie_value,
		proxy,
		cookies,
		initialize,
		get_history
	})

	const normalize_result = (result) => _normalize_result(result, afterwards, settings)

	// `url` is not really a URL,
	// it's a URL without the `origin` (scheme, host, port).
	// `url` is basically a "relative URL", i.e. "relative path" + query.
	history = create_history(parse_location(url), settings.history, parameters)

	const location = history.getCurrentLocation()
	const path     = location.pathname

	// The above code (server-side `initialize()` method call) is not included
	// in this `try/catch` block because:
	//
	//  * `parameters` are used inside `.error()`
	//
	//  * even if an error was caught inside `initialize()`
	//    and a redirection was performed, say, to an `/error` page
	//    then it would fail again because `initialize()` would get called again,
	//    so wrapping `initialize()` with `try/catch` wouldn't help anyway.
	//
	try
	{
		const initialize_time = initialize_timer()

		// Internationalization

		let locale
		let messages
		let messagesJSON

		if (localize)
		{
			// `localize()` should normally be a synchronous function.
			// It could be asynchronous though for cases when it's taking
			// messages not from a JSON file but rather from an
			// "admin" user editable database.
			// If the rountrip time (ping) from the rendering service
			// to the database is small enough then it theoretically
			// won't introduce any major page rendering latency
			// (the database will surely cache such a hot query).
			// On the other hand, if a developer fights for each millisecond
			// then `localize()` should just return `messages` from memory.

			let result = localize(parameters)

			// If `localize()` returned a `Promise` then wait for it
			if (typeof result.then === 'function')
			{
				result = await result
			}

			locale   = result.locale
			messages = result.messages

			// A tiny optimization to avoid calculating
			// `JSON.stringify(messages)` for each rendered page:
			// `localize()` can return a cached `messagesJSON` string
			// instead of `messages` JSON object
			// to further reduce internationalization-induced latency
			// by an extra millisecond or so (benchmark if interested)
			// by not stringifying `messages` JSON object for each page rendered.
			messagesJSON = result.messagesJSON || JSON.stringify(messages)
		}

		// Render the web page
		const result = await render_page
		({
			...parameters,
			hollow,
			history,
			routes,
			before_render: beforeRender,

			create_page_element(child_element, props)
			{
				if (localize)
				{
					props.locale   = locale
					props.messages = messages
				}

				return React.createElement(container, props, child_element)
			},

			render(react_element_tree, meta)
			{
				// For Redux:
				// `react_element_tree` is undefined if `hollow === true`.
				// Otherwise `react_element_tree` is `<Router>...</Router>`.

				// `html` modifiers

				let { head } = html
				// camelCase support for those who prefer it
				let body_start = html.body_start || html.bodyStart
				let body_end   = html.body_end   || html.bodyEnd

				// Normalize `html` parameters
				head       = render_to_a_string(typeof head       === 'function' ? head      (path, parameters) : head)
				body_start = render_to_a_string(typeof body_start === 'function' ? body_start(path, parameters) : body_start)
				body_end   = render_to_a_string(typeof body_end   === 'function' ? body_end  (path, parameters) : body_end)

				// Normalize assets
				assets = typeof assets === 'function' ? assets(path, parameters) : assets

				// Sanity check
				if (!assets.entries)
				{
					// Default `assets.entries` to `["main"]`.
					if (assets.javascript && assets.javascript.main)
					{
						assets.entries = ['main']
					}
					else
					{
						throw new Error(`"assets.entries[]" page rendering service configuration parameter is required: it lists all Webpack "entries" for which javascripts and styles must be included on a server-side rendered page. If you didn't set up any "entries" in Webpack configuration then the default Webpack entry is called "main", in which case set "assets.entries" to "['main']" in page rendering service configuration.`)
					}
				}

				// Render all HTML that goes before React markup.
				const before_content = render_before_content
				({
					assets,
					locale,
					meta: meta_tags(meta).join(''),
					head,
					body_start
				})

				// Render all HTML that goes after React markup
				const after_content = render_after_content
				({
					extension_javascript: typeof extension_javascript === 'function' ? extension_javascript() : extension_javascript,
					assets,
					locale,
					locale_messages_json: messagesJSON,
					body_end,
					protected_cookie_value,
					hollow
				})

				// All parts are combined into a single readable stream

				const streams =
				[
					string_stream(before_content),
					string_stream(after_content)
				]

				if (!hollow && react_element_tree)
				{
					// Render page content to a `Stream`
					// inserting this stream in the middle of `streams` array.
					// `array.splice(index, 0, element)` inserts `element` at `index`.
					streams.splice(streams.length / 2, 0, ReactDOM.renderToNodeStream(react_element_tree))
				}

				return multi_stream(streams)
			}
		})

		if (result.time)
		{
			result.time.initialize = initialize_time
		}

		return normalize_result(result)
	}
	catch (error)
	{
		// Redirection is sometimes done via an Error on server side.
		// (e.g. it can happen in `react-router`'s `onEnter()` during `match()`)
		if (error._redirect)
		{
			return normalize_result({ redirect: error._redirect })
		}

		if (error_handler)
		{
			const result = {}

			const error_handler_parameters =
			{
				path,
				url      : location_url(location),
				redirect : (to) =>
				{
					// Only the first redirect takes effect on the server side
					if (!result.redirect)
					{
						result.redirect = parse_location(to)
					}
				},
				server   : true
			}

			// Special case for Redux
			if (parameters.store)
			{
				error_handler_parameters.dispatch = redirecting_dispatch(parameters.store.dispatch, error_handler_parameters.redirect)
				error_handler_parameters.getState = parameters.store.getState
			}

			error_handler(error, error_handler_parameters)
		
			// Either redirects or throws the error
			if (result.redirect)
			{
				return normalize_result(result)
			}
		}

		throw error
	}
}

// Converts `React.Element`s to `String`s
function render_to_a_string(anything)
{
	if (!anything)
	{
		return ''
	}

	// If it's already a `String` then return it
	if (typeof anything === 'string')
	{
		return anything
	}

	// Recurse into arrays
	if (Array.isArray(anything))
	{
		return anything.map(render_to_a_string).join('')
	}

	// Render `React.Element` to a `String`
	return ReactDOM.renderToString(anything)
}

// A special flavour of `dispatch` which `throw`s for redirects on the server side.
function redirecting_dispatch(dispatch, redirect)
{
	return (event) =>
	{
		switch (event.type)
		{
			// In case of navigation from @preload()
			case Preload:
				// `throw`s a special `Error` on server side
				return redirect(event.location)
		
			default:
				// Proceed with the original
				return dispatch(event)
		}
	}
}

function _normalize_result(result, afterwards, settings)
{
	// Stringify `redirect` location
	if (result.redirect)
	{
		// Prepend `basename` to relative URLs for server-side redirect.
		result.redirect = location_url(result.redirect, { basename: settings.history.options.basename })
	}

	// Add `afterwards`
	result.afterwards = afterwards

	return result
}