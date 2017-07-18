import superagent from 'superagent'

import { is_object, starts_with } from './helpers'
import parse_dates from './date parser'
import { get_cookie_in_a_browser } from './cookies'

// This is an isomorphic (universal) HTTP client
// which works both on Node.js and in the web browser,
// and therefore can be used in Redux actions (for HTTP requests)
export default class http_client
{
	// `Set-Cookie` HTTP headers
	// (in case any cookies are set)
	set_cookies = new Set()

	// Constructs a new instance of Http client.
	// Optionally takes an Http Request as a reference to mimic
	// (in this case, cookies, to make authentication work on the server-side).
	constructor(options = {})
	{
		const
		{
			proxy,
			headers,
			clone_request,
			cookies,
			protected_cookie,
			protected_cookie_value,
			authentication_token_header,
			on_before_send,
			catch_to_retry,
			get_access_token,
			allow_absolute_urls
		}
		= options

		const parse_json_dates = options.parse_dates !== false

		// The default `transform_url` gives protection against XSS attacks
		// in a way that `Authorization: Bearer {token}` HTTP header
		// is only exposed (sent) to local URLs, therefore an attacker
		// theoretically won't be able to hijack that authentication token.
		//
		// An XSS attacker is assumed to be unable to set his own
		// `options.transform_url` because the rendered page content
		// is placed before the `options` are even defined (inside webpack bundle).
		//
		// Once `http_client` instance is created, the `protected_cookie_value` variable
		// is erased from everywhere except the closures of HTTP methods defined below,
		// and the protected cookie value is therefore unable to be read directly by an attacker.
		//
		// The `transform_url` function also resided in the closures of HTTP methods defined below,
		// so it's also unable to be changed by an attacker.
		//
		// The only thing an attacker is left to do is to send malicious requests
		// to the server on behalf of the user, and those requests would be executed,
		// but the attacker won't be able to hijack the protected cookie value.
		//
		const transform_url = options.transform_url || this.proxy_url.bind(this)

		// Clone HTTP request cookies on the server-side
		// (to make authentication work)
		if (clone_request)
		{
			this.server = true
			this.cookies_raw = clone_request.headers.cookie
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
					const key_value = cookie_raw_key_value(cookie_raw).split('=')
					return key_value[1]
				}
			}

			// Return the original request cookie
			return cookies.get(name)
		})
		:
		((name) =>
		{
			// "httpOnly" cookies can't be read by a web browser
			if (name === protected_cookie)
			{
				return protected_cookie_value
			}

			// A regular cookie which can be read by a web browser
			return get_cookie_in_a_browser(name)
		})

		// `superagent` doesn't save cookies by default on the server side.
		// Therefore calling `.agent()` explicitly to enable setting cookies.
		const agent = this.server ? superagent.agent() : superagent

		// Define HTTP methods on this `http` utility instance
		for (const method of http_methods)
		{
			this[method] = (path, data, options = {}) =>
			{
				// Rejects URLs of form "//www.google.ru/search",
				// and verifies that the `path` is an internal URL.
				// This check is performed to avoid leaking cookies
				// and HTTP authentication headers to a third party.
				if (!is_relative_url(path) && !allow_absolute_urls)
				{
					throw new Error(`You requested an absolute URL using "http" utility: "${path}". Use relative URLs instead (e.g. "/api/item/3") – this is cleaner and safer. To transform relative URLs into absolute ones configure the "http.url(relativeURL) -> absoluteURL" parameter function in "react-isomorphic-render.js". Example: (path) => \`https://api.server.com\${path}\`. Alternatively, set "http.allowAbsoluteURLs" setting to "true" (for those rare cases when it is justifiable).`)
				}

				// `url` will be absolute for server-side
				const url = transform_url(path, this.server)

				// Is incremented on each retry
				let retry_count = -1

				// Performs an HTTP request to the given `url`.
				// Can retry itself.
				const perform_http_request = () =>
				{
					// Create Http request
					const request = new Http_request(method, url, data,
					{
						agent,
						parse_json_dates,
						headers : { ...headers, ...options.headers },
						new_cookies : (new_cookies) =>
						{
							if (this.server)
							{
								// Cookies will be duplicated here
								// because `superagent.agent()` persists
								// `Set-Cookie`s between subsequent requests
								// (i.e. for the same `http_client` instance).
								// Therefore using a `Set` instead of an array.
								for (const cookie of new_cookies)
								{
									this.set_cookies.add(cookie)
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

					// Server side only
					// (copies user authentication cookies to retain session specific data)
					if (this.server && is_relative_url(path))
					{
						request.add_cookies(this.cookies_raw, this.set_cookies)
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
						// // https://github.com/halt-hammerzeit/react-isomorphic-render/issues/46
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
									this
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

function has_binary_data(data)
{
	for (let key of Object.keys(data))
	{
		const parameter = data[key]

		if (typeof HTMLInputElement !== 'undefined' && parameter instanceof HTMLInputElement)
		{
			return true
		}

		if (typeof FileList !== 'undefined' && parameter instanceof FileList)
		{
			return true
		}

		// `File` is a subclass of `Blob`
		// https://developer.mozilla.org/en-US/docs/Web/API/Blob
		if (typeof Blob !== 'undefined' && parameter instanceof Blob)
		{
			return true
		}
	}
}

function construct_form_data(data)
{
	// Just in case (who knows)
	if (typeof FormData === 'undefined')
	{
		// Silent fallback
		return data
	}

	const form_data = new FormData()

	for (let key of Object.keys(data))
	{
		let parameter = data[key]

		// For an `<input type="file"/>` DOM element just take its `.files`
		if (typeof HTMLInputElement !== 'undefined' && parameter instanceof HTMLInputElement)
		{
			parameter = parameter.files
		}

		// For a `FileList` parameter (e.g. `multiple` file upload),
		// iterate the `File`s in the `FileList`
		// and add them to the form data as a `[File]` array.
		if (typeof FileList !== 'undefined' && parameter instanceof FileList)
		{
			let i = 0
			while (i < parameter.length)
			{
				form_data.append(key, parameter[i])
				i++
			}
			continue
		}

		form_data.append(key, parameter)
	}

	return form_data
}

class Http_request
{
	constructor(method, url, data, options)
	{
		const { agent, headers, parse_json_dates, new_cookies } = options

		this.new_cookies = new_cookies

		// Create Http request.
		this.request = agent[method](url)

		// Attach data to the outgoing HTTP request
		if (data)
		{
			switch (method)
			{
				case 'get':
					this.request.query(data)
					break

				case 'post':
				case 'put':
				case 'patch':
				case 'head':
				case 'options':
					this.request.send(has_binary_data(data) ? construct_form_data(data) : data)
					break

				case 'delete':
					throw new Error(`"data" supplied for HTTP DELETE request: ${JSON.stringify(data)}`)

				default:
					throw new Error(`Unknown HTTP method: ${method}`)
			}
		}

		// Apply HTTP headers
		this.request.set(headers)

		// `true`/`false`
		this.parse_json_dates = parse_json_dates
	}

	// Sets `Authorization: Bearer ${token}` in HTTP request header
	add_authentication(authentication_token_header, authentication, get_access_token, getCookie, url, path)
	{
		let token

		if (typeof authentication === 'string')
		{
			token = authentication
		}
		else if (get_access_token)
		{
			token = get_access_token(getCookie, { url, path })
		}

		if (token && authentication !== false)
		{
			this.request.set(authentication_token_header || 'Authorization', `Bearer ${token}`)
		}
	}

	// Server side only
	// (copies user authentication cookies to retain session specific data)
	add_cookies(cookies_raw = '', set_cookies)
	{
		// Merge `cookies_raw` and `set_cookies` (a `Set`)
		if (set_cookies.size > 0)
		{
			const cookies = {}

			for (let key_value of cookies_raw.split(';'))
			{
				key_value = key_value.trim().split('=')
				cookies[key_value[0]] = key_value[1]
			}

			for (const cookie_raw of set_cookies)
			{
				const key_value = cookie_raw_key_value(cookie_raw).split('=')
				cookies[key_value[0]] = key_value[1]
			}

			cookies_raw = Object.keys(cookies).map(key => `${key}=${cookies[key]}`).join(';')
		}

		if (cookies_raw)
		{
			this.request.set('cookie', cookies_raw)
		}
	}

	// File upload progress metering
	// https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
	progress(progress)
	{
		this.request.on('progress', function(event)
		{
			if (event.direction !== 'upload')
			{
				// Only interested in file upload progress metering
				return
			}

			if (!event.lengthComputable)
			{
				// Unable to compute progress information since the total size is unknown
				return
			}

			progress(event.percent, event)
		})
	}

	send()
	{
		return new Promise((resolve, reject) =>
		{
			this.request.end((error, response) =>
			{
				// If any cookies were set then track them (for later)
				if (response && response.headers['set-cookie'])
				{
					this.new_cookies(response.headers['set-cookie'])
				}

				if (error)
				{
					// Infer additional `error` properties from the HTTP response
					if (response)
					{
						this.populate_error_data(error, response)
					}

					return reject(error)
				}

				// If HTTP response status is "204 - No content"
				// (e.g. PUT, DELETE)
				// then resolve with an empty result.
				if (response.statusCode === 204)
				{
					return resolve(undefined, response.headers)
				}

				resolve(this.get_response_data(response), response.headers)
			})
		})
	}

	populate_error_data(error, response)
	{
		// Set `error.status` to HTTP response status code
		error.status = response.statusCode

		const response_data = this.get_response_data(response)

		switch (response.type)
		{
			// Set error `data` from response body,
			case 'application/json':
			// http://jsonapi.org/
			case 'application/vnd.api+json':
				error.data = response_data

				// Set the more meaningful message for the error (if available)
				if (error.data.message)
				{
					error.message = error.data.message
				}

				break

			// If the HTTP response was not a JSON object,
			// but rather a text or an HTML page,
			// then include that information in the `error`
			// for future reference (e.g. easier debugging).

			case 'text/plain':
				error.message = response_data
				break

			case 'text/html':
				error.html = response_data

				// Recover the original error message (if any)
				if (response.headers['x-error-message'])
				{
					error.message = response.headers['x-error-message']
				}

				// Recover the original error stack trace (if any)
				if (response.headers['x-error-stack-trace'])
				{
					error.stack = JSON.parse(response.headers['x-error-stack-trace'])
				}

				break
		}
	}

	get_response_data(response)
	{
		switch (response.type)
		{
			case 'application/json':
			// http://jsonapi.org/
			case 'application/vnd.api+json':
				if (this.parse_json_dates)
				{
					return parse_dates(response.body)
				}
				return response.body

			// case 'text/plain':
			// case 'text/html':
			default:
				return response.text
		}
	}
}

// Leaves just `key=value` from the cookie string
function cookie_raw_key_value(cookie_raw)
{
	const semicolon_index = cookie_raw.indexOf(';')

	if (semicolon_index >= 0)
	{
		cookie_raw = cookie_raw.slice(0, semicolon_index)
	}

	return cookie_raw.trim()
}