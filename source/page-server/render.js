// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'

import fs from 'fs'

import Html from './html'

import { server as render } from '../redux/render'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default function({ development, localize, preferred_locale, assets, request, respond, fail, redirect, disable_server_side_rendering, log, create_store, create_routes, markup_wrapper, head, body, styles, web_server })
{
	// create Redux store
	const store = create_store({ development: development, create_routes, server: true, http_request: request, host: web_server.host, port: web_server.port })

	// internationalization

	let language
	let messages

	if (localize)
	{
		const result = localize(store, preferred_locale)

		language = result.language
		messages = result.messages
	}

	// render the web page
	return render
	({
		disable_server_side_rendering,
		url: request.originalUrl.replace(/\?$/, ''),
		markup_wrapper: component => 
		{
			let options = { store }

			if (localize)
			{
				options.locale   = language
				options.messages = messages
			}

			return markup_wrapper(component, options)
		},
		html:
		{
			with_rendering: component => <Html development={development} assets={assets()} language={language} messages={messages} head={head} body={body} styles={styles} store={store} component={component}/>,
			without_rendering:     () => <Html development={development} assets={assets()} language={language} messages={messages} head={head} body={body} styles={styles} store={store}/>
		},
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