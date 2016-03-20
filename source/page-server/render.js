// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'

import fs from 'fs'

import Html from './html'

import { server as redux_render } from '../redux/render'
import { server as react_render } from '../render'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default async function({ development, preload, localize, preferred_locale, assets, url, http_client, respond, fail, redirect, disable_server_side_rendering, log, create_store, create_routes, markup_wrapper, head, body, body_start, body_end, style })
{
	// initial Flux store data (if using Flux)
	let store_data = {}

	// supports custom preloading before the page is rendered
	// (for example to authenticate the user and retrieve user selected language)
	if (preload)
	{
		store_data = (await preload(http_client)) || store_data
	}

	// create Redux store
	let store
	if (create_store)
	{
		store = create_store({ development, create_routes, server: true, http_client, data: store_data })
	}

	// internationalization

	let locale
	let messages

	if (localize)
	{
		const result = await localize(store, preferred_locale)

		locale   = result.locale
		messages = result.messages
	}

	const entry_point = 'main' // may examine `url` to determine Webpack entry point

	// if Redux is being used, then render for Redux.
	// else render for pure React.
	const render = store ? redux_render : react_render

	// render the web page
	try
	{
		const { status, markup, redirect_to } = await render
		({
			disable_server_side_rendering,
			
			url,

			create_page_element: (child_element, props) => 
			{
				if (localize)
				{
					props.locale   = locale
					props.messages = messages
				}

				return React.createElement(markup_wrapper, props, child_element)
			},

			render_html: element =>
			{
				const markup = 
				(
					<Html 
						development={development} 
						assets={assets()} 
						entry_point={entry_point} 
						locale={locale} 
						head={head} 
						body={body} 
						body_start={body_start}
						body_end={body_end} 
						style={style} 
						store={store}>

						{element}
					</Html>
				)

				return markup
			},

			store,

			// create_routes is only used for pure React-router rendering
			create_routes: store ? undefined : create_routes
		})

		if (redirect_to)
		{
			return redirect(redirect_to)
		}

		respond({ status, markup })
	}
	catch (error)
	{
		// a somewhat hacky way to do a redirect
		if (error.redirect_to)
		{
			return redirect(error.redirect_to)
		}

		// calls user supplied error handler
		fail(error)
	}
}