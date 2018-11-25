import superagent from 'superagent'

import { starts_with } from './helpers'
import { getCookie as _getCookie } from './client/cookies'
import HttpRequest, { get_cookie_key_value } from './HttpRequest'

// This is an isomorphic (universal) HTTP client
// which works both on Node.js and in the web browser,
// and therefore can be used in Redux actions (for HTTP requests)
export default class HttpClient
{
	// `Set-Cookie` HTTP headers
	// (in case any cookies are set)
	// set_cookies = new Set()
	set_cookies = []

	// Constructs a new instance of Http client.
	// Optionally takes an Http Request as a reference to mimic
	// (in this case, cookies, to make authentication work on the server-side).
	constructor(options = {})
	{
		const
		{
			proxy,
			headers,
			cookies,
			authentication_token_header,
			on_before_send,
			catch_to_retry,
			get_access_token,
			allow_absolute_urls
		}
		= options

		const parse_json_dates = options.parseDates !== false

		const transform_url = options.transform_url || this.proxy_url.bind(this)

		// Clone HTTP request cookies on the server-side
		// (to make authentication work)
		if (cookies)
		{
			this.server = true
		}

		this.proxy = proxy

		const http_methods =
		[
			'get',
			'post',
			'put',
			'patch',
			'delete',
			'head',
			'options'
		]

		// "Get cookie value by name" helper (works both on client and server)
		const getCookie = this.server
		?
		((name) =>
		{
			// If this cookie was set dynamically then return it
			for (const cookie_raw of this.set_cookies)
			{
				if (cookie_raw.indexOf(`${name}=`) === 0)
				{
					const [key, value] = get_cookie_key_value(cookie_raw)
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
		for (const method of http_methods)
		{
			this[method] = (path, data, options = {}) =>
			{
				// `url` will be absolute for server-side
				const url = transform_url(path, this.server)

				// Is incremented on each retry
				let retry_count = -1

				// Performs an HTTP request to the given `url`.
				// Can retry itself.
				const perform_http_request = () =>
				{
					// Create Http request
					const request = new HttpRequest(method, url, data,
					{
						agent,
						parse_json_dates,
						on_response_headers : options.onResponseHeaders,
						headers : { ...headers, ...options.headers },
						new_cookies_added : (cookies) =>
						{
							if (this.server)
							{
								// Cookies will be duplicated here
								// because `superagent.agent()` persists
								// `Set-Cookie`s between subsequent requests
								// (i.e. for the same `HttpClient` instance).
								// Therefore using a `Set` instead of an array.
								for (const cookie of cookies)
								{
									// this.set_cookies.add(cookie)
									if (this.set_cookies.indexOf(cookie) < 0) {
										this.set_cookies.push(cookie)
									}
								}
							}
						}
					})

					// Sets `Authorization: Bearer ${token}` in HTTP request header
					request.add_authentication
					(
						authentication_token_header,
						options.authentication,
						get_access_token,
						getCookie,
						url,
						path
					)

					// On server side, add cookies to relative HTTP requests.
					if (this.server && is_relative_url(path))
					{
						request.add_cookies(cookies, this.set_cookies)
					}

					// Allows customizing HTTP requests
					// (for example, setting some HTTP headers)
					if (on_before_send)
					{
						on_before_send(request.request)
					}

					// File upload progress metering
					// https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
					if (options.progress)
					{
						request.progress(options.progress)
					}

					// If using `bluebird` and `Promise` cancellation is configured
					// http://bluebirdjs.com/docs/api/cancellation.html
					return new Promise((resolve, reject, onCancel) =>
					{
						// Send HTTP request
						request.send().then(resolve, reject)

						// If using `bluebird` and `Promise` cancellation is configured
						// http://bluebirdjs.com/docs/api/cancellation.html
						// https://github.com/petkaantonov/bluebird/issues/1323
						if (Promise.version && onCancel)
						{
							onCancel(() => request.request.abort())
						}

						// // One could store the `request` to later `.abort()` it.
						// // https://github.com/catamphetamine/react-website/issues/46
						// if (options.onRequest)
						// {
						// 	options.onRequest(request.request)
						// }
					})
					.then
					(
						(response) => response,
						(error) =>
						{
							// `superagent` would have already output the error to console
							// console.error(error.stack)

							// (legacy)
							//
							// this turned out to be a lame way of handling cookies,
							// because cookies are sent in request
							// with no additional parameters
							// such as `path`, `httpOnly` and `expires`,
							// so there were cookie duplication issues.
							//
							// if (response)
							// {
							// 	if (response.get('set-cookie'))
							// 	{
							// 		this.cookies_raw = response.get('set-cookie')
							// 	}
							// }

							// Can optionally retry an HTTP request in case of an error
							// (e.g. if an Auth0 access token expired and has to be refreshed).
							// https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
							if (catch_to_retry)
							{
								retry_count++

								return catch_to_retry(error, retry_count,
								{
									getCookie,
									http: this
								})
								.then(perform_http_request)
							}

							// HTTP request failed with an `error`
							return Promise.reject(error)
						}
					)
				}

				return perform_http_request()
			}
		}
	}

	// Validates the requested URL,
	// and also prepends host and port to it on the server side.
	proxy_url(path, server)
	{
		// Prepend host and port on the server side
		if (this.proxy && server)
		{
			const protocol = this.proxy.secure ? 'https' : 'http'
			return `${protocol}://${this.proxy.host}:${this.proxy.port || '80'}${path}`
		}

		return path
	}
}

function is_relative_url(path)
{
	return starts_with(path, '/') && !starts_with(path, '//')
}