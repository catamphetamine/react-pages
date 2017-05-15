import UglifyJS from 'uglify-js'

import { ISO_date_regexp } from '../../date parser'
import { safe_json_stringify } from '../../page-server/html'
import render from './render'
import create_store from '../store'
import create_http_client from '../http client'

export default function _render(options)
{
	return render
	({
		...options,
		routes: typeof options.routes === 'function' ? options.routes(store) : options.routes
	})
}

export async function initialize(settings, { protected_cookie_value, application, request, cookies, initialize, get_history })
{
	// Redux store
	let store

	// Create HTTP client (Redux action creator `http` utility)
	const http_client = create_http_client(settings, () => store, protected_cookie_value,
	{
		host          : application ? application.host : undefined,
		port          : application ? application.port : undefined,
		secure        : application ? application.secure : false,
		clone_request : request,
		cookies
	})

	// Create Redux store

	// Initial store data
	let store_data = {}

	// Supports custom preloading before the page is rendered
	// (for example to authenticate the user and retrieve user selected language)
	if (initialize)
	{
		store_data = await initialize(http_client, { request })
	}

	// Create Redux store
	store = create_store(settings, store_data, get_history, http_client,
	{
		server : true
	})

	function extension_javascript()
	{
		let extension_javascript = ''

		// JSON Date deserializer
		if (settings.parse_dates)
		{
			extension_javascript += `<script>${define_json_date_parser}</script>`
		}

		const store_state = store.getState()
		// Remove `redux-router` data from store
		delete store_state.router

		// Store data will be reloaded into the store on the client-side.
		// All forward slashes are escaped to prevent XSS attacks.
		// Another solution would be replacing with `\uxxxx` sequences.
		// https://medium.com/node-security/the-most-common-xss-vulnerability-in-react-js-applications-2bdffbcc1fa0
		extension_javascript += `<script>`
		extension_javascript += `window._redux_state = JSON.parse(${ JSON.stringify(safe_json_stringify(store_state)) }${ settings.parse_dates ? ', JSON.date_parser' : '' })`
		extension_javascript += `</script>`

		return extension_javascript
	}

	function afterwards(ctx)
	{
		for (const cookie of http_client.set_cookies)
		{
			ctx.set('Set-Cookie', cookie)
		}
	}

	return { store, extension_javascript, afterwards }
}

// JSON date deserializer
// use as the second, 'reviver' argument to JSON.parse(json, JSON.date_parser);
//
// http://stackoverflow.com/questions/14488745/javascript-json-date-deserialization/23691273#23691273
//
const define_json_date_parser = UglifyJS.minify
(`
if (!JSON.date_parser)
{
	JSON.date_parser = function(key, value)
	{
		if (typeof value === 'string' && /^${ISO_date_regexp}$/.test(value))
		{
			return new Date(value)
		}

		return value
	}
}
`,
{ fromString: true }).code

// Just to be extra safe from XSS attacks
if (define_json_date_parser.indexOf('</') !== -1)
{
	throw new Error('JSON Date parser XSS vulnerability detected')
}