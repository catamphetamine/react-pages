import superagent from 'superagent'

import { is_object, starts_with } from './helpers'

// This is an isomorphic (universal) HTTP client
// which works both on Node.js and in the web browser,
// and therefore can be used in Flux actions (for HTTP requests)
export default class http_client
{
	// Constructs a new instance of Http client.
	// Optionally takes an Http Request as a reference to mimic
	// (in this case, cookies, to make authentication work on the server-side).
	constructor(options = {})
	{
		const { secure, host, port, headers, clone_request } = options

		// For those who don't wish to proxy API requests to API servers
		// and prefer to query those API servers directly (for whatever reasons).
		// Direct API calls will contain user's cookies (e.g. JWT token).
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
								request.send(data)
								break

							case 'delete':
								throw new Error(`"data" supplied for HTTP DELETE request: ${JSON.stringify(data)}`)

							default:
								throw new Error(`Unknown HTTP method: ${method}`)
						}
					}

					// Server side only
					// (copies user authentication cookies to retain session specific data)
					if (this.cookies)
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
										error.data = response.body

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
							return reject(parse_dates(error))
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
						resolve(parse_dates(response.body))
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
		if (starts_with(path, '//') || !starts_with(path, '/'))
		{
			throw new Error(`Only internal URLs (e.g. "/api/item?id=1") are allowed for the "http" utility. Got an external url "${path}"`)
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

// JSON date deserializer.
//
// Automatically converts ISO serialized `Date`s
// in JSON responses for Ajax HTTP requests.
//
// Without it the developer would have to convert
// `Date` strings to `Date`s in Ajax HTTP responses manually.
//
// Use as the second, 'reviver' argument to `JSON.parse`: `JSON.parse(json, JSON.date_parser)`
//
// http://stackoverflow.com/questions/14488745/javascript-json-date-deserialization/23691273#23691273

// ISO 8601 date regular expression
const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/

// Walks JSON object tree
function parse_dates(object)
{
	// If it's a date in an ISO string format, then parse it
	if (typeof object === 'string' && ISO.test(object))
	{
		return new Date(object)
	}
	// If an array is encountered, 
	// proceed recursively with each element of this array.
	else if (object instanceof Array)
	{
		let i = 0
		while (i < object.length)
		{
			object[i] = parse_dates(object[i])
			i++
		}
	}
	// If a child JSON object is encountered,
	// convert all of its `Date` string values to `Date`s,
	// and proceed recursively for all of its properties.
	else if (is_object(object))
	{
		for (let key of Object.keys(object))
		{
			// proceed recursively
			object[key] = parse_dates(object[key])
		}
	}

	// Dates have been converted for this JSON object
	return object
}