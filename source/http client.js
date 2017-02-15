import superagent from 'superagent'

import { is_object, starts_with } from './helpers'
import parse_dates from './date parser'

// This is an isomorphic (universal) HTTP client
// which works both on Node.js and in the web browser,
// and therefore can be used in Redux actions (for HTTP requests)
export default class http_client
{
	// Constructs a new instance of Http client.
	// Optionally takes an Http Request as a reference to mimic
	// (in this case, cookies, to make authentication work on the server-side).
	constructor(options = {})
	{
		const { secure, host, port, headers, clone_request, authentication_token, authentication_token_header } = options

		const parse_json_dates = options.parse_dates !== false

		// The default `format_url` gives protection against XSS attacks
		// in a way that `Authorization: Bearer {token}` HTTP header
		// is only exposed (sent) to local URLs, therefore an attacker
		// theoretically won't be able to hijack that authentication token.
		//
		// An XSS attacker is assumed to be unable to set his own
		// `options.format_url` because the rendered page content
		// is placed before the `options` are even defined (inside webpack bundle).
		//
		// Once `http_client` instance is created, the `authentication_token` variable
		// is erased from everywhere except the closures of HTTP methods defined below,
		// and the token is therefore unable to be read directly by an attacker.
		//
		// The `format_url` function also resided in the closures of HTTP methods defined below,
		// so it's also unable to be changed by an attacker.
		//
		// The only thing an attacker is left to do is to send malicious requests
		// to the server on behalf of the user, and those requests would be executed,
		// but the attacker won't be able to hijack the authentication token.
		//
		const format_url = options.format_url || this.format_url.bind(this)

		// Clone HTTP request cookies on the server-side
		// (to make authentication work)
		if (clone_request)
		{
			this.server = true
			this.cookies = clone_request.headers.cookie
		}
		
		this.host = host
		this.port = port || 80
		this.secure = secure

		this.on_before_send_listeners = []

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

		// Define HTTP methods on this instance
		for (let method of http_methods)
		{
			this[method] = (path, data, options = {}) =>
			{
				// `url` will be absolute for server-side
				const url = format_url(path, this.server)

				return new Promise((resolve, reject) =>
				{
					// Create Http request
					const agent = this.server ? superagent.agent() : superagent
					const request = agent[method](url)

					// Attach data to the outgoing HTTP request
					if (data)
					{
						switch (method)
						{
							case 'get':
								request.query(data)
								break

							case 'post':
							case 'put':
							case 'patch':
							case 'head':
							case 'options':
								request.send(has_binary_data(data) ? construct_form_data(data) : data)
								break

							case 'delete':
								throw new Error(`"data" supplied for HTTP DELETE request: ${JSON.stringify(data)}`)

							default:
								throw new Error(`Unknown HTTP method: ${method}`)
						}
					}

					// Set JWT token in HTTP request header (if the token is passed)
					if (authentication_token && options.authentication !== false)
					{
						request.set(authentication_token_header || 'Authorization', `Bearer ${authentication_token}`)
					}

					// Server side only
					// (copies user authentication cookies to retain session specific data)
					if (this.cookies && is_relative_url(path))
					{
						request.set('cookie', this.cookies)
					}

					// Apply default HTTP headers
					if (headers)
					{
						request.set(headers)
					}

					// Apply this HTTP request specific HTTP headers
					if (options.headers)
					{
						request.set(options.headers)
					}

					// // Set HTTP locale header
					// // (for example, for getting localized response)
					// if (options.locale)
					// {
					// 	request.set('accept-language', options.locale)
					// }

					// Apply custom adjustments to HTTP request
					for (let listener of this.on_before_send_listeners)
					{
						listener(request)
					}

					// File upload progress metering
					// https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
					if (options.progress)
					{
						request.on('progress', function(event)
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

							options.progress(event.percent, event)
						})
					}

					// Send HTTP request
					request.end((error, response) => 
					{
						// this turned out to be a lame way of handling cookies,
						// because cookies are sent in request 
						// with no additional parameters
						// such as `path`, `httpOnly` and `expires`,
						// so there were cookie duplication issues.
						//
						// now superagent.agent() handles cookies correctly.
						//
						// if (response)
						// {
						// 	if (response.get('set-cookie'))
						// 	{
						// 		this.cookies = response.get('set-cookie')
						// 	}
						// }

						// If there was an error, then reject the Promise
						if (error)
						{
							// `superagent` would have already output the error to console
							// console.error(error.stack)

							// console.log('[react-isomorphic-render] (http request error)')

							// Infer additional `error` properties from the HTTP response
							if (response)
							{
								// Set `error.status` to HTTP response status code
								error.status = response.statusCode

								switch (response.type)
								{
									// Set error `data` from response body,
									case 'application/json':
										// if (!is_object(error.data))
										error.data = get_response_body(response, parse_json_dates)

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
										error.message = response.text
										break

									case 'text/html':
										error.html = response.text

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

							// HTTP request failed with an `error`
							return reject(error)
						}

						// HTTP request completed without errors,
						// so return the HTTP response data.

						// If HTTP response status is "204 - No content"
						// (e.g. PUT, DELETE)
						// then resolve with an empty result
						if (response.statusCode === 204)
						{
							return resolve()
						}

						// Else, the result is HTTP response body
						resolve(get_response_body(response, parse_json_dates))
					})
				})
			}
		}
	}

	// Validates the requested URL,
	// and also prepends host and port to it on the server side.
	format_url(path, server)
	{
		// Rejects URLs of form "//www.google.ru/search",
		// and verifies that the `path` is an internal URL.
		// This check is performed to avoid leaking cookies to a third party.
		if (!is_relative_url(path))
		{
			throw new Error(`Only internal URLs (e.g. "/api/item?id=1") are allowed for the "http" utility. Got an external url "${path}". A developer can allow absolute URLs by supplying a custom (looser) "http.url" parameter function (see the README).`)
		}

		// Prepend host and port on the server side
		if (server)
		{
			const protocol = this.secure ? 'https' : 'http'
			return `${protocol}://${this.host}:${this.port}${path}`
		}

		return path
	}

	// Allows hooking into HTTP request sending routine
	// (for example, to set some HTTP headers)
	on_before_send(listener)
	{
		this.on_before_send_listeners.push(listener)
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

function get_response_body(response, parse_json_dates)
{
	let response_body = response.body
	
	if (response.type === 'application/json' && parse_json_dates)
	{
		response_body = parse_dates(response_body)
	}

	return response_body
}