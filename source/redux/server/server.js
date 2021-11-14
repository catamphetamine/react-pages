import { ISO_date_regexp } from '../../parseDates'
import { safeJsonStringify } from '../../server/html'
import createStore from '../store'
import createHttpClient from '../HttpClient'
import createHistoryProtocol from '../../router/server/createHistoryProtocol'

export async function initialize(settings, {
	proxy,
	cookies,
	headers,
	locales,
	url,
	getInitialState
}) {
	// Redux store
	let store

	// Create HTTP client (Redux action creator `http` utility)
	const httpClient = createHttpClient(settings, () => store, {
		proxy,
		cookies
	})

	// Initial Redux state.
	// `User-Agent` and `Accept-Language` headers were requested:
	// https://github.com/catamphetamine/react-website/issues/72
	const initialState = getInitialState ? getInitialState({
		cookies,
		headers,
		locales
	}) : {}

	// Create Redux store.
	store = createStore(settings, initialState, () => createHistoryProtocol(url), httpClient, {
		getCookie: name => cookies[name],
		server: true
	})

	return {
		store,
		generateJavascript: () => generateJavascript(store, settings),
		cookies: httpClient.cookiesSetOnServer
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
// `JSON.parse(json, JSON.dateParser)` is about 2.5 times slower than `JSON.parse(json)` in Chrome.
const DEFINE_JSON_DATE_PARSER = `
if (!JSON.dateParser) {
	JSON.dateParser = function(key, value) {
		if (typeof value === 'string' && /^${ISO_date_regexp}$/.test(value)) {
			return new Date(value)
		}
		return value
	}
}`

// Since version 6.x, `terser` no longer provides a synchronous `minify()` function.
// import Terser from 'terser'
// DEFINE_JSON_DATE_PARSER = Terser.minify(DEFINE_JSON_DATE_PARSER).code

// Just to be extra safe from XSS attacks
if (DEFINE_JSON_DATE_PARSER.indexOf('<') !== -1) {
	throw new Error('JSON Date parser XSS vulnerability detected')
}