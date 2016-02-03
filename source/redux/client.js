// client side rendering function

import React from 'react'

import { client as client_render } from './render'
import dev_tools                   from './dev tools'
import { exists }                  from '../helpers'

import http_client from '../http client'

import set_up_client_rendering, { create_react_page_element } from '../client'

// sets up client side rendering
export default function({ development, development_tools, to, create_store, create_routes, markup_wrapper, load_localized_messages })
{
	// create Redux store
	const store = create_store({ data: window._flux_store_data, create_routes, http_client: new http_client() })
	delete window._flux_store_data

	// returns a Promise for the rendered React page component
	function render(parameters)
	{
		return client_render({ store, ...parameters })
	}

	// resolves the Promise with the React page element
	function create_page_element(element, props, markup_wrapper)
	{
		// create React page element
		const page_element = create_react_page_element(element, props, markup_wrapper)

		// if Redux-devtools aren't enabled, then just return the Page elemnt
		if (!development_tools)
		{
			return page_element
		}

		// Render dev tools after initial client render to prevent warning
		// "React attempted to reuse markup in a container but the checksum was invalid"
		// https://github.com/erikras/react-redux-universal-hot-example/pull/210
		//
		// (practically does nothing)
		ReactDOM.render(page_element, content_container)

		console.log(`You are gonna see a warning about "React.findDOMNode is deprecated" in the console. It's normal: redux_devtools hasn't been updated to React 0.14 yet`)

		// this element will contain React page element and Redux-devtools
		const page_element_with_dev_tools = 
		(
			<div>
				{page_element}
				<dev_tools/>
			</div>
		)

		// return React page element
		return page_element_with_dev_tools
	}

	// use the base method
	return set_up_client_rendering({ development, to, render, create_page_element, create_routes, markup_wrapper, load_localized_messages })
}