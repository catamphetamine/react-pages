import React          from 'react'
import ReactDOM       from 'react-dom'
import ReactDOMServer from 'react-dom/server'

import { Router, RoutingContext, useRoutes, match, RouterContext, browserHistory } from 'react-router'

// renders directly to the "to" DOM element.
//
// returns a Promise resolving to the rendered React component
//
export function client({ development, element, create_page_element, to, create_routes })
{
	// renders the passed element into the DOM element containing React markup
	function render_page_element(element)
	{
		const component = ReactDOM.render(element, to)

		if (development)
		{
			window.React = React // enable debugger

			if (!to || !to.firstChild || !to.firstChild.attributes || !to.firstChild.attributes['data-react-checksum'])
			{
				console.error('Server-side React render was discarded. Make sure that your initial render does not contain any client-side code.')
			}
		}

		return component
	}

	// in case of pure React-router rendering, perform routing first
	// (<RoutingContext/> and useRoutes(history).listen() can be used here instead
	//  for asynchronous routing, that is to implement <Route/> React component @preload()ing)
	if (!element && create_routes)
	{
		const router_element = <Router history={browserHistory} routes={create_routes()}/>

		return create_page_element(router_element, {store}).then(element => render_page_element({ element }))
	}

	// Redux is being used - just render the passed in element
	return render_page_element(element)
}

// returns a Promise resolving to { status, markup, redirect_to }
//
export function server({ disable_server_side_rendering, render_html, render, create_routes, page_element, url })
{
	// renders React page content element
	// (wrapping it with the <Html/> component)
	// to the resulting Html markup code
	// (returns a string containing the final html markup)
	function to_html(content_element)
	{
		return '<!doctype html>\n' + ReactDOMServer.renderToString(render_html(content_element))
	}

	// if server side rendering has been switched off,
	// then render an empty page
	// (client side rendering will render the page then)
	if (disable_server_side_rendering)
	{
		return Promise.resolve({ markup: to_html() })
	}

	// if the page element has already been prerendered
	// (it can be undefined too, if server-sider rendering is switched off)
	if (!render)
	{
		return Promise.resolve({ markup: to_html(page_element) })
	}

	// perform React-router routing and render the result to Html code

	// the following code hasn't been tested.
	// if it doesn't work then create an issue on github.
	return new Promise((resolve, reject) =>
	{
		// perform React-router routing
		match({ routes, location: url }, (error, redirect_location, render_props) =>
		{
			// routing process failed
			if (error)
			{
				return reject(error)
			}
			
			// if a decision to perform a redirect was made 
			// during the routing process,
			// then redirect to another url
			if (redirect_location)
			{
				return resolve
				({
					redirect_to: redirect_location.pathname + redirect_location.search
				})
			}

			// if the page was not found
			if (!render_props)
			{
				const error = new Error('Not found')
				error.status = 404
				return reject(error)
			}

			// You can also check render_props.components or render_props.routes for
			// your "not found" component or route respectively, and send a 404 as
			// below, if you're using a catch-all route.
			resolve({ markup: to_html(render(<RouterContext {...render_props}/>)) })
		})
	})
}