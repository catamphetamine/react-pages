import http from 'http'
import https from 'https'
import cookie from 'cookie'

import render from './render'
import render_error from './render error'
import { get_preferred_locales } from './locale'
import timer from '../timer'

export default function server(settings, options)
{
	return (options.secure ? https : http).createServer((request, response) =>
	{
		// Render the page (and handle errors, if any)
		render_page(request, response, settings, options)
			.catch((error) => render_error(error, response, options))
	})
}

// Renders a webpage
async function render_page(request, response, settings, options)
{
	const
	{
		secure,
		proxy,
		assets,
		localize,
		authentication,
		initialize,
		hollow,
		html,
		stats
	}
	= options

	const url = request.url
	const cookies = request.headers.cookie ? cookie.parse(request.headers.cookie) : {}

	const total_timer = timer()

	const { status, content, redirect, route, time, cookies: set_cookies } = await render(settings,
	{
		proxy,
		assets,
		localize : localize ? (parameters) => localize(parameters, get_preferred_locales(request.headers, cookies)) : undefined,
		authentication,
		initialize,
		hollow,
		html,
		url,
		// // HTTP headers.
		// // Some people use them to get things like `window.navigator` on server side.
		// headers: request.headers,
		// Cookies for protected cookie value retrieval
		cookies
	})

	// Can add `Set-Cookie` headers, for example.
	if (set_cookies)
	{
		// `set_cookies` is a `Set`, not an `Array`,
		// hence the `for` loop.
		for (const cookie of set_cookies)
		{
			response.setHeader('Set-Cookie', cookie)
		}
	}

	// If a redirect happened perform an HTTP redirect
	if (redirect)
	{
		let redirect_url = redirect

		// Convert relative URL to an absolute one
		if (redirect_url[0] === '/')
		{
			redirect_url = `${secure ? 'https' : 'http'}://${request.headers.host}${redirect_url}`;
		}

		response.writeHead(302,
		{
			Location: redirect_url
		})

		return response.end()
	}

	// HTTP response status and "Content-Type"
	response.writeHead(status || 200,
	{
		'Content-Type': 'text/html'
	})

	// Stream the rendered React page
	content.pipe(response)

	// Report page rendering stats
	if (stats)
	{
		stats
		({
			url,
			route,
			time:
			{
				...time,
				total: total_timer()
			}
		})
	}
}