import fs   from 'fs'
import path from 'path'

import koa        from 'koa'
import koa_locale from 'koa-locale'

import http_client from '../http client'
import render      from './render'

export default function start_web_server({ development, localize, assets, host, port, web_server, log, disable_server_side_rendering, create_store, create_routes, markup_wrapper, head, body, body_end, style, on_error })
{
	log = log || console

	const web = koa()

	// get locale from Http request
	// (the second parameter is the Http Get parameter name)
	koa_locale(web, 'locale')

	// handle errors

	function* errors(next)
	{
		try
		{
			yield next
		}
		catch (error)
		{
			// log the error
			log.error(error)

			this.status = typeof error.code === 'number' ? error.code : 500
			this.message = error.message || 'Internal error'
		}
	}

	web.use(errors)

	// isomorphic rendering

	function* rendering()
	{
		// isomorphic http api calls
		const _http_client = new http_client({ host: web_server.host, port: web_server.port, clone_request: this.request })
	
		// Material-UI asks for this,
		// but this isn't right,
		// because Node.js serves requests asynchronously
		// and therefore two different web browsers 
		// may be asking for a rendered page simultaneously.
		//
		// global.navigator = { userAgent: request.headers['user-agent'] }

		const url = this.request.originalUrl.replace(/\?$/, '')

		const redirect = to => this.redirect(to)

		// these parameters are for Koa app.
		// they can be modified to work with Express app if needed.
		yield render
		({
			development,

			localize,
			preferred_locale: this.getLocaleFromQuery() || this.getLocaleFromCookie() || this.getLocaleFromHeader(),

			assets,

			url,

			http_client : _http_client, 

			respond : ({ markup, status }) =>
			{
				this.body = markup

				if (status)
				{
					this.status = status
				}
			}, 
			fail     : error =>
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
			log,

			create_store,
			create_routes,

			markup_wrapper,

			head,
			body,
			body_end,
			style
		})

		this.set('set-cookie', _http_client.cookies)
	}

	web.use(rendering)

	// start http server
	web.listen(port, host, function(error)
	{
		if (error)
		{
			return log.error(error)
		}

		log.info(`Webpage server is listening at http://${host ? host : 'localhost'}:${port}`)
	})
}