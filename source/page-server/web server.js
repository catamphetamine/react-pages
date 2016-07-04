import fs   from 'fs'
import path from 'path'

import koa        from 'koa'
import koa_locale from 'koa-locale'

import http_client from '../http client'
import render      from './render'

import render_stack_trace from './html stack trace'

export default function start_web_server({ development, preload, localize, assets, host, port, web_server, log, disable_server_side_rendering, create_store, create_routes, markup_wrapper, head, body, body_start, body_end, style, on_error })
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
			// if the error is caught here it means that `on_error` didn't resolve it
			// (or threw it)

			// show error stack trace in development mode for easier debugging
			if (development)
			{
				try
				{
					const { response_status, response_body } = render_stack_trace(error)

					if (response_body)
					{
						this.status = response_status || 500
						this.body = response_body
						this.type = 'html'

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

			preload,
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
			log,

			create_store,
			create_routes,

			markup_wrapper,

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
		// this.set('set-cookie', _http_client.cookies)
	}

	web.use(rendering)

	// start http server
	web.listen(port, host, function(error)
	{
		if (error)
		{
			console.log('[react-isomorphic-render] Webpage rendering server shutdown due to an error')
			return log.error(error)
		}

		log.info(`Webpage server is listening at http://${host ? host : 'localhost'}:${port}`)
	})
}