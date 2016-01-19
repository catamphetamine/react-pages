// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'

import fs from 'fs'

import Html from './html'

import { server as render } from '../redux/render'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default function({ development, localize, preferred_locale, assets, request, respond, fail, redirect, disable_server_side_rendering, log, create_store, create_routes, markup_wrapper, head, body, style, web_server })
{
	// create Redux store
	const store = create_store({ development, create_routes, server: true, http_request: request, host: web_server.host, port: web_server.port })

	// internationalization

	let locale
	let messages

	if (localize)
	{
		const result = localize(store, preferred_locale)

		locale   = result.locale
		messages = result.messages
	}

	const entry_point = 'main' // may examine request.originalUrl to determine Webpack entry point

	// render the web page
	return render
	({
		disable_server_side_rendering,
		url: request.originalUrl.replace(/\?$/, ''),
		render: (child_element, props) => 
		{
			if (localize)
			{
				props.locale   = locale
				props.messages = messages
			}

			return React.createElement(markup_wrapper, props, child_element)
		},
		render_html: element => <Html development={development} assets={assets()} entry_point={entry_point} locale={locale} head={head} body={body} style={style} store={store}>{element}</Html>,
		store
	})
	.then(({ status, markup, redirect_to }) =>
	{
		if (redirect_to)
		{
			return redirect(redirect_to)
		}

		respond({ status, markup })
	},
	error =>
	{
		log.error(error)

		if (error.markup)
		{
			respond({ markup: error.markup, status: 500 })
		}
		else
		{
			fail(error)
		}
	})
}