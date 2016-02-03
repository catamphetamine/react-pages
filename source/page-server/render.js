// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'

import fs from 'fs'

import Html from './html'

import { server as redux_render } from '../redux/render'
import { server as react_render } from '../render'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default function({ development, localize, preferred_locale, assets, url, http_client, respond, fail, redirect, disable_server_side_rendering, log, create_store, create_routes, markup_wrapper, head, body, body_end, style })
{
	// create Redux store
	let store
	if (create_store)
	{
		store = create_store({ development, create_routes, server: true, http_client })
	}

	// internationalization

	let locale
	let messages

	if (localize)
	{
		const result = localize(store, preferred_locale)

		locale   = result.locale
		messages = result.messages
	}

	const entry_point = 'main' // may examine `url` to determine Webpack entry point

	// if Redux is being used, then render for Redux.
	// else render for pure React.
	const render = store ? redux_render : react_render

	// render the web page
	return render
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

		render_html: element => <Html 
			development={development} 
			assets={assets()} 
			entry_point={entry_point} 
			locale={locale} 
			head={head} 
			body={body} 
			body_end={body_end} 
			style={style} 
			store={store}>

			{element}
		</Html>,

		store,

		// create_routes is only used for pure React-router rendering
		create_routes: store ? undefined : create_routes
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
		if (error.redirect_to)
		{
			return redirect(error.redirect_to)
		}

		fail(error)

		// if (error.markup)
		// {
		// 	respond({ markup: error.markup, status: error.status || 500 })
		// }
		// else
		// {
		// 	fail(error)
		// }
	})
}