import superagent from 'superagent'

import { starts_with } from './helpers'

export default class http_client
{
	// Constructs a new instance of Api Client.
	// Optionally takes an Http Request as a reference to mimic (for example, cookies).
	// This feature is used for Api calls during server side rendering 
	// (this way server side Http Api calls mimic client side Http Api calls).
	constructor(options = {})
	{
		const { host, port, prefix, clone_request } = options

		if (clone_request)
		{
			this.server = true
			this.cookies = clone_request.get('cookie')
		}
		
		this.host = host
		this.port = port || 80
		this.prefix = prefix || ''

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

				const url = this.format_url(path)

				return new Promise((resolve, reject) =>
				{
					const request = superagent[http_method](url)

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

					// server side only
					// (copies user authentication cookies to retain session specific data)
					if (this.cookies)
					{
						request.set('cookie', this.cookies)
					}

					if (options && options.locale)
					{
						request.set('accept-language', locale)
					}

					request.end((error, response) => 
					{
						if (response)
						{
							if (response.get('set-cookie'))
							{
								this.cookies = response.get('set-cookie')
							}
						}

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

						resolve(response.body)
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
}