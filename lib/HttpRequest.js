import parseDates from './parseDates.js'
import isObject from './isObject.js'

// Performs HTTP requests
export default class HttpRequest {
	constructor(method, url, data, options) {
		const {
			agent,
			headers,
			useCrossDomainCookies,
			shouldParseJsonDates,
			onAddCookies,
			onResponseHeaders
		} = options

		this.onAddCookies = onAddCookies

		// Create Http request.
		this.request = agent[method](url)

		// By default, an HTTP request won't send or receive cookies
		// when sending a request to another domain (`credentials: "same-site"`).
		//
		// To override that behavior, define a `settings.http.useCrossDomainCookies()`
		// function that would return `true` for a certain `url` (or `originalUrl`):
		// it would have the same effect as `credentials: "include"` option in `fetch()`
		// and will send and receive cookies when sending a request to another domain.
		// (In an `XMLHttpRequest`, the option is called `withCredentials: true`).
		//
		// Another option is `credentials: "omit"` — it won't nethier send nor receive cookies.
		//
		if (useCrossDomainCookies) {
			// https://github.com/visionmedia/superagent/issues/1172#issue-206075764
			this.request = this.request.withCredentials()
		}

		// Attach data to the outgoing HTTP request
		if (data) {
			switch (method) {
				case 'get':
					this.request.query(data)
					break

				case 'post':
				case 'put':
				case 'patch':
				case 'head':
				case 'options':
					if (hasBinaryData(data)) {
						addMultipartData(this.request, data)
					} else {
						this.request.send(data)
					}
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
		this.shouldParseJsonDates = shouldParseJsonDates

		// Can be used for examining HTTP response headers
		// (e.g. Amazon S3 file upload)
		this.onResponseHeaders = onResponseHeaders
	}

	// Sets `Authorization: Bearer ${token}` in HTTP request header
	addAuthenticationToken(authTokenHeader, authentication, getAuthToken, getCookie, url, originalUrl) {
		let token
		if (typeof authentication === 'string') {
			token = authentication
		} else if (getAuthToken) {
			token = getAuthToken(getCookie, {
				url,
				originalUrl
			})
		}
		if (token && authentication !== false) {
			this.request.set(authTokenHeader || 'Authorization', `Bearer ${token}`)
		}
	}

	// Server side only
	// (copies user authentication cookies to retain session specific data)
	addCookies(cookies, cookiesToAdd) {
		// Merge the initial HTTP request `cookies` and `cookiesToAdd` (a `Set`)
		if (cookiesToAdd.size > 0) {
			cookies = { ...cookies }
			for (const cookieRaw of cookiesToAdd) {
				const [key, value] = getCookieKeyAndValue(cookieRaw)
				cookies[key] = value
			}
		}
		if (Object.keys(cookies).length > 0) {
			this.request.set('cookie', Object.keys(cookies).map(key => `${key}=${cookies[key]}`).join(';'))
		}
	}

	// File upload progress metering
	// https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
	progress(progress) {
		this.request.on('progress', function(event) {
			if (event.direction !== 'upload') {
				// Only interested in file upload progress metering
				return
			}
			if (!event.lengthComputable) {
				// Unable to compute progress information since the total size is unknown
				return
			}
			progress(event.percent, event)
		})
	}

	send() {
		return this.request.then(
			(response) => {
				if (this.onResponseHeaders) {
					this.onResponseHeaders(response.headers)
				}
				// (on the server)
				// If any cookies were set then track them (for later).
				// `response.headers['set-cookie']` is an array of `String`s.
				if (response.headers['set-cookie']) {
					this.onAddCookies(response.headers['set-cookie'])
				}
				// If HTTP response status is "204 - No content"
				// (PUT, DELETE) then resolve with an empty result.
				if (response.statusCode !== 204) {
					return this.getResponseData(response)
				}
			},
			(error) => {
				// Infer additional `error` properties from the HTTP response.
				if (error.response) {
					this.populateErrorDataFromResponse(error, error.response)
				}
				throw error
			}
		)
	}

	populateErrorDataFromResponse(error, response) {
		const responseData = this.getResponseData(response)

		// Set `error.status` to HTTP response status code
		error.status = response.statusCode

		switch (response.type) {
			// Set error `data` from response body,
			case 'application/json':
			// http://jsonapi.org/
			case 'application/vnd.api+json':
				error.data = responseData
				// Set the more meaningful message for the error (if available)
				if (error.data.message) {
					error.message = error.data.message
				}
				break

			// If the HTTP response was not a JSON object,
			// but rather a text or an HTML page,
			// then include that information in the `error`
			// for future reference (e.g. easier debugging).

			case 'text/plain':
				error.message = responseData
				break

			case 'text/html':
				error.html = responseData
				// Recover the original error message (if any)
				if (response.headers['x-error-message']) {
					error.message = response.headers['x-error-message']
				}
				// Recover the original error stack trace (if any)
				if (response.headers['x-error-stack-trace']) {
					error.stack = JSON.parse(response.headers['x-error-stack-trace'])
				}
				break
		}
	}

	getResponseData(response) {
		switch (response.type) {
			case 'application/json':
			// http://jsonapi.org/
			case 'application/vnd.api+json':
				if (this.shouldParseJsonDates) {
					return parseDates(response.body)
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
export function getCookieKeyAndValue(cookieRaw) {
	const semicolonIndex = cookieRaw.indexOf(';')
	if (semicolonIndex >= 0) {
		cookieRaw = cookieRaw.slice(0, semicolonIndex)
	}
	return cookieRaw.trim().split('=')
}

function addMultipartData(request, data) {
	for (const key of Object.keys(data)) {
		let parameter = data[key]
		// For an `<input type="file"/>` DOM element just take its `.files`
		if (typeof HTMLInputElement !== 'undefined' && parameter instanceof HTMLInputElement) {
			parameter = parameter.files
		}
		// For a `FileList` parameter (e.g. `multiple` file upload),
		// iterate the `File`s in the `FileList`
		// and add them to the form data as a `[File]` array.
		if (typeof FileList !== 'undefined' && parameter instanceof FileList) {
			let i = 0
			while (i < parameter.length) {
				request.attach(key, parameter[i])
				i++
			}
		} else if (typeof File !== 'undefined' && parameter instanceof File) {
			request.attach(key, parameter)
		} else {
			request.field(key, parameter)
		}
	}
}

function hasBinaryData(data) {
	if (!isObject(data)) {
		return false
	}
	for (const key of Object.keys(data)) {
		const parameter = data[key]
		if (typeof HTMLInputElement !== 'undefined' && parameter instanceof HTMLInputElement) {
			return true
		}
		if (typeof FileList !== 'undefined' && parameter instanceof FileList) {
			return true
		}
		// `File` is a subclass of `Blob`
		// https://developer.mozilla.org/en-US/docs/Web/API/Blob
		if (typeof Blob !== 'undefined' && parameter instanceof Blob) {
			return true
		}
	}
}