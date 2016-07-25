import fs   from 'fs'
import path from 'path'

import koa        from 'koa'
import koa_locale from 'koa-locale'

import render      from './render'

import render_stack_trace from './html stack trace'

import { normalize_common_options } from '../redux/normalize'

export default function start_webpage_rendering_server(options, common)
{
	// In development mode errors are printed as HTML, for example
	const development = process.env.NODE_ENV !== 'production'

	common = normalize_common_options(common)

	let
	{
		preload,
		localize,
		assets,
		application,
		disable_server_side_rendering,
		on_error,

		// Legacy 4.x API support
		head,
		body,
		body_start,
		body_end,
		style
	}
	= options

	// Legacy 4.x API support
	const html = options.html ||
	{
		head,
		body,
		body_start,
		body_end,
		style
	}

	// Normalize `assets` parameter
	// (to be a function)
	if (typeof assets !== 'function')
	{
		const assets_object = assets
		assets = () => assets_object
	}

	const web = new koa()

	// Adds helper methods for getting locale from Http request
	// (the second parameter is the Http Get parameter name)
	koa_locale(web, 'locale')

	// Handles errors
	web.use(async (ctx, next) =>
	{
		try
		{
			await next()
		}
		catch (error)
		{
			// if the error is caught here it means that `on_error` didn't resolve it
			// (or threw it)

			// show error stack trace in development mode for easier debugging
			if (development)
			{
				try
				{
					const { response_status, response_body } = render_stack_trace(error, options.print_error)

					if (response_body)
					{
						ctx.status = response_status || 500
						ctx.body = response_body
						ctx.type = 'html'

						return
					}
				}
				catch (error)
				{
					console.log('(couldn\'t render error stack trace)')
					console.log(error.stack || error)
				}
			}

			// log the error
			console.log('[react-isomorphic-render] Webpage rendering server error')

			ctx.status = typeof error.code === 'number' ? error.code : 500
			ctx.message = error.message || 'Internal error'
		}
	})

	// Custom Koa middleware extension point
	// (if someone ever needs this)
	if (options.middleware)
	{
		for (let middleware of options.middleware)
		{
			web.use(middleware)
		}
	}

	// Isomorphic rendering
	web.use(async (ctx) =>
	{
		// Material-UI asks for this,
		// but this isn't right,
		// because Node.js serves requests asynchronously
		// and therefore two different web browsers 
		// may be asking for a rendered page simultaneously.
		//
		// global.navigator = { userAgent: request.headers['user-agent'] }

		// Trims a question mark in the end (just in case)
		const url = ctx.request.originalUrl.replace(/\?$/, '')

		// Performs HTTP redirect
		const redirect_to = to => ctx.redirect(to)

		// Give `localize` a hint on which locale to choose
		if (localize)
		{
		    // Preferred locale (e.g. 'ru-RU').
		    // Can be obtained from `language` cookie
		    // or from 'Accept-Language' HTTP header.
		    const preferred_locale = ctx.getLocaleFromQuery() || ctx.getLocaleFromCookie() || ctx.getLocaleFromHeader()
		    const _localize = localize
		    localize = (store) => _localize(store, preferred_locale)
		}

		try
		{
			const { status, content, redirect } = await render
			({
				application,
				assets,
				preload,
				localize,
				disable_server_side_rendering,
				html,

				// The original HTTP request can be required
				// for inspecting cookies in `preload` function
				request: ctx.req
			},
			common)

			if (redirect)
			{
				return redirect_to(redirect)
			}

			if (status)
			{
				ctx.status = status
			}

			ctx.body = content
		}
		catch (error)
		{
			if (on_error)
			{
				return on_error(error,
				{
					url,
					redirect: redirect_to
				})
			}

			throw error
		}

		// This turned out to be a lame way to do it,
		// because cookies are sent in request 
		// with no additional parameters
		// such as `path`, `httpOnly` and `expires`,
		// so there were cookie duplication issues.
		//
		// Now superagent.agent() handles cookies correctly.
		//
		// ctx.set('set-cookie', _http_client.cookies)
	})

	return web
}