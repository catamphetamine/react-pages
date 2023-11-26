// Currently, `fetch` is not used.
// But it could be used in some future instead of `superagent`.
//
// While it's not used, I've commented it out
// because it broke CommonJS import support.
//
// import fetch from 'node-fetch'

import { IsoDatePattern } from '../../parseDates.js'
import { safeJsonStringify } from '../../server/html.js'
import createStore from '../store.js'
import Stash from '../Stash.js'
import createHttpClient from '../HttpClient.js'
import createHistoryProtocol from '../../router/server/createHistoryProtocol.js'
import getNavigationLocation from '../navigation/getNavigationLocation.js'

export async function initialize(settings, {
	proxy,
	cookies,
	headers,
	locales,
	url,
	origin,
	location,
	getLoadContext,
	getInitialState
}) {
	// Redux store.
	// This variable is used in `httpClient`,
	// that's why it's declared at the top.
	let store

	// Create HTTP client (Redux action creator `http` utility)
	const httpClient = createHttpClient(settings, () => store, {
		proxy,
		cookies,
		server: true,
		fetch: undefined
	})

	// Initial Redux state.
	// `User-Agent` and `Accept-Language` headers were requested:
	// https://github.com/catamphetamine/react-website/issues/72
	const initialState = getInitialState ? getInitialState({
		cookies,
		headers,
		locales
	}) : {}

	// `found` router doesn't emit `UPDATE_MATCH` or `RESOLVE_MATCH` events on the server side.
	// So `navigationLocation` property is not set in Redux state dynamically via `dispatch()`.
	// For that reason, `navigationLocation` property should be set in the initial state.
	initialState.navigationLocation = getNavigationLocation(location)

	// Create utility data stash.
	const stash = new Stash()

	// Create Redux store.
	store = createStore({
		initialState,
		createHistoryProtocol: () => createHistoryProtocol({ url, origin }),
		httpClient,
		stash,
		settings,
		options: {
			getCookie: name => cookies[name],
			server: true,
			context: getLoadContext && getLoadContext({
				dispatch: (action) => store.dispatch(action)
			})
		}
	})

	return {
		store,
		stash,
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
	code += `window._ReactPages_ReduxStateServerSideSnapshot = JSON.parse(${ JSON.stringify(safeJsonStringify(store.getState())) }${ settings.parseDates ? ', JSON.dateParser' : '' })`
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
		if (typeof value === 'string' && /^${IsoDatePattern}$/.test(value)) {
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