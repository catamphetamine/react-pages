import UglifyJS from 'uglify-js'

import { ISO_date_regexp } from '../../parseDates'
import { safeJsonStringify } from '../../server/html'
import render from './render'
import createStore from '../store'
import createHttpClient from '../HttpClient'
import { createHistoryProtocol } from '../../router/server'

export async function initialize(settings, {
	protected_cookie_value,
	proxy,
	cookies,
	initialize,
	url
})
{
	// Redux store
	let store

	// Create HTTP client (Redux action creator `http` utility)
	const httpClient = createHttpClient(settings, () => store, protected_cookie_value, {
		proxy,
		cookies
	})

	// Create Redux store

	// Initial store data
	let initialState = {}

	// Supports custom preloading before the page is rendered
	// (for example to authenticate the user and retrieve user selected language)
	if (initialize) {
		initialState = await initialize(httpClient)
	}

	// Create Redux store
	store = createStore(settings, initialState, () => createHistoryProtocol(url), httpClient, {
		server : true
	})

	return {
		store,
		generateJavascript: () => generateJavascript(store, settings),
		cookies: httpClient.set_cookies
	}
}

function generateJavascript(store, settings) {
	let code = ''

	// JSON Date deserializer
	if (settings.parseDates) {
		code += `<script>${DEFINE_JSON_DATE_PARSER}</script>`
	}

	// Store data will be reloaded into the store on the client-side.
	// All forward slashes are escaped to prevent XSS attacks.
	// Another solution would be replacing with `\uxxxx` sequences.
	// https://medium.com/node-security/the-most-common-xss-vulnerability-in-react-js-applications-2bdffbcc1fa0
	code += `<script>`
	code += `window._redux_state = JSON.parse(${ JSON.stringify(safeJsonStringify(store.getState())) }${ settings.parseDates ? ', JSON.dateParser' : '' })`
	code += `</script>`

	return code
}

// JSON date deserializer.
// Use as the second, 'reviver' argument to `JSON.parse(json, JSON.dateParser)`.
// http://stackoverflow.com/questions/14488745/javascript-json-date-deserialization/23691273#23691273
const DEFINE_JSON_DATE_PARSER = UglifyJS.minify
(`
if (!JSON.dateParser) {
	JSON.dateParser = function(key, value) {
		if (typeof value === 'string' && /^${ISO_date_regexp}$/.test(value)) {
			return new Date(value)
		}
		return value
	}
}
`, { fromString: true }).code

// Just to be extra safe from XSS attacks
if (DEFINE_JSON_DATE_PARSER.indexOf('<') !== -1) {
	throw new Error('JSON Date parser XSS vulnerability detected')
}