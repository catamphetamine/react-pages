// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'

import fs from 'fs'

import Html from './html'

import { render_on_server as redux_render }        from '../redux/render'
import { render_on_server as react_router_render } from '../redux/render'

import create_store from '../redux/store'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default async function({ development, preload, localize, preferred_locale, assets, url, http_client, respond, fail, redirect, disable_server_side_rendering, get_reducer, redux_middleware, on_store_created, on_preload_error, create_routes, wrapper, head, body, body_start, body_end, style })
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
	if (get_reducer)
	{
		store = create_store(get_reducer,
		{
			development,
			server: true,
			create_routes,
			data: store_data,
			middleware: redux_middleware,
			on_store_created,
			on_preload_error,
			http_client
		})
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

	// if Redux is being used, then render for Redux.
	// else render for pure React.
	const render = store ? redux_render : react_router_render

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

				return React.createElement(wrapper, props, child_element)
			},

			render_webpage_as_react_element: content =>
			{
				const markup = 
				(
					<Html
						development={development}
						assets={assets(url)}
						locale={locale}
						head={head}
						body={body}
						body_start={body_start}
						body_end={body_end}
						style={style}
						store={store}>

						{content}
					</Html>
				)

				return markup
			},

			store,

			// create_routes is only used for bare React-router rendering
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
		// A somewhat hacky way to do a redirect.
		// I'm using it in my projects when throwing
		// "403 Unauthorized" errors while redirecting user to "Access denied" page.
		if (error.redirect_to)
		{
			return redirect(error.redirect_to)
		}

		// Calls user supplied error handler
		fail(error)
	}
}