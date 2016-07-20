import fs   from 'fs'
import path from 'path'

import koa        from 'koa'
import koa_locale from 'koa-locale'

import Http_client from '../http client'
import render      from './render'

import render_stack_trace from './html stack trace'

import { normalize_common_options } from '../redux/normalize'

export default function start_webpage_rendering_server(options, common)
{
	common = normalize_common_options(common)

	let
	{
		development,
		preload,
		localize,
		assets,
		application,
		disable_server_side_rendering,
		head,
		body,
		body_start,
		body_end,
		style,
		on_error
	}
	= options

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
		// isomorphic http api calls
		const http_client = new Http_client({ host: application.host, port: application.port, clone_request: ctx.req })

		// Material-UI asks for this,
		// but this isn't right,
		// because Node.js serves requests asynchronously
		// and therefore two different web browsers 
		// may be asking for a rendered page simultaneously.
		//
		// global.navigator = { userAgent: request.headers['user-agent'] }

		const url = ctx.request.originalUrl.replace(/\?$/, '')

		const redirect = to => ctx.redirect(to)

		// these parameters are for Koa app.
		// they can be modified to work with Express app if needed.
		await render
		({
			development,

			preload,
			localize,
			preferred_locale: ctx.getLocaleFromQuery() || ctx.getLocaleFromCookie() || ctx.getLocaleFromHeader(),

			assets,

			url,

			// The original HTTP request can be required
			// for inspecting cookies in `preload` function
			request: ctx.req,

			http_client,
			http_client_on_before_send: common.http_request,

			respond : ({ markup, status }) =>
			{
				ctx.body = markup

				if (status)
				{
					ctx.status = status
				}
			}, 
			fail : error =>
			{
				if (on_error)
				{
					return on_error(error,
					{
						redirect,
						url
					})
				}

				throw error
			}, 
			redirect,

			disable_server_side_rendering,

			get_reducer      : common.get_reducer,
			redux_middleware : common.redux_middleware,
			on_store_created : common.on_store_created,
			on_preload_error : common.on_preload_error,
			create_routes    : common.create_routes,
			wrapper          : common.wrapper,

			head,
			body,
			body_start,
			body_end,
			style
		})

		// this turned out to be a lame way to do it,
		// because cookies are sent in request 
		// with no additional parameters
		// such as `path`, `httpOnly` and `expires`,
		// so there were cookie duplication issues.
		//
		// now superagent.agent() handles cookies correctly.
		//
		// ctx.set('set-cookie', _http_client.cookies)
	})

	return web
}