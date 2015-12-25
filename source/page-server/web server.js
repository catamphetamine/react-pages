import fs   from 'fs'
import path from 'path'

import koa        from 'koa'
import koa_locale from 'koa-locale'

import render from './render'

export default function start_web_server({ development, localize, assets, host, port, web_server, log, disable_server_side_rendering, create_store, markup_wrapper, head, body, styles })
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
		// these parameters are for Koa app.
		// they can be modified to work with Express app if needed.
		yield render
		({
			development,

			localize,
			preferred_locale: this.getLocaleFromQuery() || this.getLocaleFromCookie() || this.getLocaleFromHeader(),

			assets,

			request : this.request, 
			respond : ({ markup, status }) =>
			{
				this.body = markup

				if (status)
				{
					this.status = status
				}
			}, 
			fail     : error => this.throw(error), 
			redirect : to => this.redirect(to),

			disable_server_side_rendering,
			log,

			create_store,

			markup_wrapper,

			head,
			body,
			styles,

			web_server
		})
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