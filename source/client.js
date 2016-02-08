// client side rendering function

import React from 'react'

import { client as client_render } from './render'
import { exists }                  from './helpers'

import http_client from './http client'

// sets up client side rendering
export default function({ development, to, render, create_page_element, create_routes, markup_wrapper, load_localized_messages })
{
	// creates React page element
	create_page_element = create_page_element || create_react_page_element

	// returns a Promise for the rendered React page component
	render = render || client_render

	// international

	const locale = window._locale

	if (locale)
	{
		delete window._locale
	}

	// renders current React page.
	// returns the rendered React page component.
	function render_page()
	{
		// returns a Promise for React component.
		//
		return render
		({
			development,
			create_page_element : (element, props) =>
			{
				// if no i18n is required, then simply create Page element
				if (!locale)
				{
					return Promise.resolve(create_page_element(element, props, markup_wrapper))
				}

				// translation loading function must be passed
				if (!load_localized_messages)
				{
					return Promise.reject(new Error(`You are supposed to pass 
						"load_localized_messages(locale) => Promise" function 
						as a parameter to client-side rendering function call
						because you opted into using internationalization feature`))
				}

				// load translations and then create page element
				return load_localized_messages(locale).then(messages =>
				{
					props.locale   = locale
					props.messages = messages

					// create React page element
					return create_page_element(element, props, markup_wrapper)
				})
			},
			create_routes,
			to: to || document.getElementById('react_markup')
		})
	}

	// render page (on the client side)
	//
	return render_page().then(component => ({ rerender: render_page }))
}

export function create_react_page_element(element, props, markup_wrapper)
{
	return React.createElement(markup_wrapper, props, element)
}