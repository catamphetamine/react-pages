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
		render_page_http(request, response, settings, options)
			.catch((error) => render_error_http(error, response, options.printError))
	})
}

// Renders a webpage
async function render_page_http(request, response, settings, options)
{
	const
	{
		redirect,
		cookies,
		status,
		content
	}
	= await render_page(request.url, request.headers, settings, options)

	if (redirect)
	{
		response.writeHead(302, { Location: redirect })
		return response.end()
	}

	// `cookies` is a `Set`, not an `Array`,
	// hence the `for` loop.
	for (const cookie of cookies)
	{
		response.setHeader('Set-Cookie', cookie)
	}

	// HTTP response status and "Content-Type"
	response.writeHead(status || 200, { 'Content-Type': 'text/html' })

	// Stream the rendered React page
	content.pipe(response)
}

// Renders a webpage.
// `headers`: `{ cookie, accept-language, host }`.
export async function render_page(url, headers, settings, options)
{
	// Support `2.0.x`.
	if (typeof url === 'object')
	{
		throw new Error(`[react-website] The internal "render()" function was changed in v2.1.0: it now takes 4 arguments instead of 2. And the object being returned also changed. See README-ADVANCED for more info.`)
	}

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

	const cookies = headers.cookie ? cookie.parse(headers.cookie) : {}

	const total_timer = timer()

	let { status, content, redirect, route, time, cookies: set_cookies } = await render(settings,
	{
		proxy,
		assets,
		localize : localize ? (parameters) => localize(parameters, get_preferred_locales(headers, cookies)) : undefined,
		authentication,
		initialize,
		hollow,
		html,
		url,
		// // HTTP headers.
		// // Some people use them to get things like `window.navigator` on server side.
		// headers,
		// Cookies for protected cookie value retrieval
		cookies
	})

	// If a redirect happened perform an HTTP redirect
	if (redirect)
	{
		// Convert relative URL to an absolute one
		if (redirect[0] === '/')
		{
			redirect = `${secure ? 'https' : 'http'}://${headers.host}${redirect}`;
		}

		return { redirect }
	}

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

	return {
		cookies: set_cookies,
		status,
		content
	}
}

function render_error_http(error, response, options)
{
	const { status, content, contentType } = render_error(error, options)

	// HTTP response status and "Content-Type"
	response.writeHead(status, { 'Content-Type': contentType })

	// Output the error page
	return response.end(content)
}