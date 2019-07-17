import superagent from 'superagent'

import { starts_with } from './helpers'
import { getCookie as _getCookie } from './client/cookies'
import HttpRequest, { getCookieKeyAndValue } from './HttpRequest'

const HTTP_METHODS = [
	'get',
	'post',
	'put',
	'patch',
	'delete',
	'head',
	'options'
]

// This is an isomorphic (universal) HTTP client
// which works both on Node.js and in the web browser,
// and therefore can be used in Redux actions (for HTTP requests)
export default class HttpClient {
	// `Set-Cookie` HTTP headers
	// (in case any cookies are set)
	// cookiesSetOnServer = new Set()
	cookiesSetOnServer = []

	// Constructs a new instance of Http client.
	// Optionally takes an Http Request as a reference to mimic
	// (in this case, cookies, to make authentication work on the server-side).
	constructor(options = {}) {
		const {
			proxy,
			headers,
			cookies,
			authTokenHeader,
			onBeforeSend,
			catchToRetry,
			getAuthToken
		} = options

		const shouldParseJsonDates = options.parseDates !== false

		const transformUrl = options.transformUrl || this.proxyUrl.bind(this)

		// Clone HTTP request cookies on the server-side
		// (to make authentication work)
		if (cookies) {
			this.server = true
		}

		this.proxy = proxy

		// "Get cookie value by name" helper (works both on client and server)
		const getCookie = this.server
		?
		((name) => {
			// If this cookie was set dynamically then return it
			for (const cookieRaw of this.cookiesSetOnServer) {
				if (cookieRaw.indexOf(`${name}=`) === 0) {
					const [key, value] = getCookieKeyAndValue(cookieRaw)
					return value
				}
			}
			// Return the original request cookie
			return cookies[name]
		})
		:
		_getCookie

		// `superagent` doesn't save cookies by default on the server side.
		// Therefore calling `.agent()` explicitly to enable setting cookies.
		const agent = this.server ? superagent.agent() : superagent

		// Define HTTP methods on this `http` utility instance
		for (const method of HTTP_METHODS) {
			this[method] = (path, data, options = {}) => {
				// `url` will be absolute for server-side
				const url = transformUrl(path, this.server)

				// Is incremented on each retry
				let retryCount = -1

				// Performs an HTTP request to the given `url`.
				// Can retry itself.
				const performHttpRequest = () => {
					// Create Http request
					const request = new HttpRequest(method, url, data, {
						agent,
						shouldParseJsonDates,
						onResponseHeaders: options.onResponseHeaders,
						headers: { ...headers, ...options.headers },
						onAddCookies: (cookies) => {
							if (this.server) {
								// Cookies will be duplicated here
								// because `superagent.agent()` persists
								// `Set-Cookie`s between subsequent requests
								// (i.e. for the same `HttpClient` instance).
								// Therefore using a `Set` instead of an array.
								for (const cookie of cookies) {
									// this.cookiesSetOnServer.add(cookie)
									if (this.cookiesSetOnServer.indexOf(cookie) < 0) {
										this.cookiesSetOnServer.push(cookie)
									}
								}
							}
						}
					})

					// Sets `Authorization: Bearer ${token}` in HTTP request header
					request.addAuthenticationToken(
						authTokenHeader,
						options.authentication,
						getAuthToken,
						getCookie,
						url,
						path
					)

					// On server side, add cookies to relative HTTP requests.
					if (this.server && isRelativeUrl(path)) {
						request.addCookies(cookies, this.cookiesSetOnServer)
					}

					// Allows customizing HTTP requests.
					// (for example, setting some HTTP headers,
					//  or changing HTTP request `Content-Type`).
					// https://github.com/catamphetamine/react-website/issues/73
					if (onBeforeSend) {
						onBeforeSend(request.request, {
							url,
							requestedURL: path
						})
					}

					// File upload progress metering
					// https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
					if (options.progress) {
						request.progress(options.progress)
					}

					return request.send().then(
						(response) => response,
						(error) => {
							// `superagent` would have already output the error to console
							// console.error(error.stack)
							// Can optionally retry an HTTP request in case of an error
							// (e.g. if a JWT access token expired and has to be refreshed using a "refresh" token).
							// https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
							if (catchToRetry) {
								retryCount++
								return catchToRetry(error, retryCount, {
									getCookie,
									http: this
								})
								.then(performHttpRequest)
							}
							// HTTP request failed with an `error`
							throw error
						}
					)
				}

				return performHttpRequest()
			}
		}
	}

	// Validates the requested URL,
	// and also prepends host and port to it on the server side.
	proxyUrl(path, server) {
		// Prepend host and port on the server side
		if (this.proxy && server) {
			const protocol = this.proxy.secure ? 'https' : 'http'
			return `${protocol}://${this.proxy.host}:${this.proxy.port || '80'}${path}`
		}
		return path
	}
}

function isRelativeUrl(path) {
	return starts_with(path, '/') && !starts_with(path, '//')
}