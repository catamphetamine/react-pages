import http from 'http'
import https from 'https'
import cookie from 'cookie'

import render from './render'
import renderError from './renderError'
import timer from '../timer'
import { getPreferredLocales } from './locale'

export default function server(settings, options)
{
	if (options.initialize) {
		throw new Error('[react-pages] "initialize" server-side parameter function was removed. Use a root-level `load` instead.')
	}
	return (options.secure ? https : http).createServer((request, response) => {
		// Render the page (and handle errors, if any)
		respondWithPage(request, response, settings, options)
			.catch((error) => respondWithError(error, response, options.printError))
	})
}

// Renders a webpage
async function respondWithPage(request, response, settings, options)
{
	const {
		redirect,
		cookies,
		status,
		content
	} = await renderPage(request.url, request.headers, settings, options)

	if (redirect) {
		response.writeHead(302, { Location: redirect })
		return response.end()
	}

	// `cookies` is a `Set`, not an `Array`,
	// hence the `for` loop.
	for (const cookie of cookies) {
		response.setHeader('Set-Cookie', cookie)
	}

	// HTTP response status and "Content-Type"
	response.writeHead(status || 200, { 'Content-Type': 'text/html' })

	// Stream the rendered React page
	content.pipe(response)
}

// Renders a webpage.
// `headers`: `{ cookie, accept-language, host, user-agent }`.
export async function renderPage(url, headers, settings, options)
{
	const {
		secure,
		proxy,
		assets,
		authentication,
		renderContent,
		html,
		stats,
		getInitialState
	} = options

	const cookies = headers.cookie ? cookie.parse(headers.cookie) : {}

	let {
		status,
		content,
		redirect,
		route,
		time,
		cookies: newCookies
	} = await render(settings, {
		proxy,
		assets,
		authentication,
		renderContent,
		html,
		url,
		// Cookies for making `http` requests on server.
		cookies,
		locales: getPreferredLocales(headers),
		// Headers are used in `getInitialState()`.
		// https://github.com/catamphetamine/react-website/issues/72
		getInitialState,
		headers
	})

	// If a redirect happened perform an HTTP redirect
	if (redirect) {
		// No need to convert a relative URL to an absolute URL:
		// since June 2014 the RFC permits redirection to relative URLs.
		// https://stackoverflow.com/questions/8250259/is-a-302-redirect-to-relative-url-valid-or-invalid
		// // Convert relative URL to an absolute one
		// if (redirect[0] === '/') {
		// 	redirect = `${secure ? 'https' : 'http'}://${headers.host}${redirect}`;
		// }
		return { redirect }
	}

	// Report page rendering stats
	if (stats) {
		stats({
			url,
			route,
			time
		})
	}

	return {
		cookies: newCookies,
		status,
		content
	}
}

function respondWithError(error, response, options)
{
	const { status, content, contentType } = renderError(error, options)

	// HTTP response status and "Content-Type"
	response.writeHead(status, { 'Content-Type': contentType })

	// Output the error page
	return response.end(content)
}