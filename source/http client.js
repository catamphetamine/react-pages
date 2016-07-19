import superagent from 'superagent'

import { is_object, starts_with } from './helpers'

export default class http_client
{
	// Constructs a new instance of Api Client.
	// Optionally takes an Http Request as a reference to mimic (for example, cookies).
	// This feature is used for Api calls during server side rendering 
	// (this way server side Http Api calls mimic client side Http Api calls).
	constructor(options = {})
	{
		const { host, port, headers, prefix, clone_request } = options

		if (clone_request)
		{
			this.server = true
			this.cookies = clone_request.get('cookie')
		}
		
		this.host = host
		this.port = port || 80
		this.prefix = prefix || ''

		this.on_before_send_listeners = []

		const http = {}

		const http_methods =
		{
			get    : 'get',
			post   : 'post',
			call   : 'post',
			create : 'post',
			put    : 'put',
			update : 'put',
			patch  : 'patch',
			delete : 'del'
		}

		for (let method of Object.keys(http_methods))
		{
			this[method] = (path, data, options) =>
			{
				// options = options || {}

				const http_method = http_methods[method]

				if (!http_method)
				{
					throw new Error(`Api method not found: ${method}`)
				}

				// `url` will be absolute for server-side
				const url = this.format_url(path)

				return new Promise((resolve, reject) =>
				{
					const agent = this.server ? superagent.agent() : superagent
					const request = agent[http_method](url)

					if (data)
					{
						if (http_method === 'post')
						{
							request.send(data)
						}
						else
						{
							request.query(data)
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
					if (options && options.headers)
					{
						request.set(options.headers)
					}

					if (options && options.locale)
					{
						request.set('accept-language', locale)
					}

					// Apply custom adjustments to HTTP request
					for (let listener of this.on_before_send_listeners)
					{
						listener(request)
					}

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

						if (!error && response)
						{
							error = response.error
						}

						if (error)
						{
							// superagent would have already output the error to console
							// console.error(error.stack)

							console.log('[react-isomorphic-render] (http request error)')

							if (response)
							{
								error.code = response.status

								const content_type = response.get('content-type').split(';')[0].trim()

								if (content_type === 'text/plain')
								{
									error.message = response.text
								}
								else if (content_type === 'text/html')
								{
									error.html = response.text
								}
							}

							return reject(error)
						}

						resolve(parse_dates(response.body))
					})
				})
			}
		}
	}

	format_url(path)
	{
		// add slash in the beginning
		let normalized_path = path[0] !== '/' ? '/' + path : path

		if (this.server)
		{
			// Prepend host and port of the API server to the path.
			return `http://${this.host}:${this.port}${this.prefix}${normalized_path}`
		}

		// Prepend prefix to relative URL, to proxy to API server.
		return this.prefix + normalized_path
	}

	on_before_send(listener)
	{
		this.on_before_send_listeners.push(listener)
	}
}

// JSON date deserializer
// use as the second, 'reviver' argument to JSON.parse(json, JSON.date_parser);
//
// http://stackoverflow.com/questions/14488745/javascript-json-date-deserialization/23691273#23691273

const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/

function parse_dates(object)
{
	if (object instanceof Array)
	{
		let i = 0
		while (i < object.length)
		{
			object[i] = parse_dates(object[i])
			i++
		}
	}
	else if (is_object(object))
	{
		for (let key of Object.keys(object))
		{
			const value = object[key]
			if (typeof value === 'string' && ISO.test(value))
			{
				object[key] = new Date(value)
			}
			else
			{
				// proceed recursively
				parse_dates(value)
			}
		}
	}

	return object
}