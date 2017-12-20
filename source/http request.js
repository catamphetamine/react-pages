import parse_dates from './date parser'
import { is_object } from './helpers'

// Performs HTTP requests
export default class HTTP_Request
{
	constructor(method, url, data, options)
	{
		const
		{
			agent,
			headers,
			parse_json_dates,
			new_cookies_added,
			on_response_headers
		}
		= options

		this.new_cookies_added = new_cookies_added

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

		// Can be used for examining HTTP response headers
		// (e.g. Amazon S3 file upload)
		this.on_response_headers = on_response_headers
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
	add_cookies(cookies, set_cookies)
	{
		// Merge the initial HTTP request `cookies` and `set_cookies` (a `Set`)
		if (set_cookies.size > 0)
		{
			cookies = { ...cookies }

			for (const cookie_raw of set_cookies)
			{
				const [key, value] = get_cookie_key_value(cookie_raw)
				cookies[key] = value
			}
		}

		if (Object.keys(cookies).length > 0)
		{
			this.request.set('cookie', Object.keys(cookies).map(key => `${key}=${cookies[key]}`).join(';'))
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
				if (response)
				{
					if (this.on_response_headers)
					{
						this.on_response_headers(response.headers)
					}

					// (on the server)
					// If any cookies were set then track them (for later).
					// `response.headers['set-cookie']` is an array of `String`s.
					if (response.headers['set-cookie'])
					{
						this.new_cookies_added(response.headers['set-cookie'])
					}
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
					return resolve()
				}

				resolve(this.get_response_data(response))
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

// Returns `[key, value]` from a raw cookie string
export function get_cookie_key_value(cookie_raw)
{
	const semicolon_index = cookie_raw.indexOf(';')

	if (semicolon_index >= 0)
	{
		cookie_raw = cookie_raw.slice(0, semicolon_index)
	}

	return cookie_raw.trim().split('=')
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

	for (const key of Object.keys(data))
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

function has_binary_data(data)
{
	if (!is_object(data))
	{
		return false
	}

	for (const key of Object.keys(data))
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