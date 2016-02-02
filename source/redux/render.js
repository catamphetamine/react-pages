import { client as default_client_render, server as default_server_render } from '../render'

import { match } from 'redux-router/server'
import { ReduxRouter } from 'redux-router'

import React          from 'react'
import ReactDOMServer from 'react-dom/server'

// returns a Promise for React component.
//
// renders directly to the "to" DOM element.
// (to allow for faster DOM mutations instead of simple slow Html code replacement)
export function client({ development, render, create_routes, store, to })
{
	let router_element = <ReduxRouter routes={create_routes({store})} />

	return render(router_element, {store}).then(element =>
	{
		return default_client_render
		({
			development, 
			element,
			to
		})
	})
}

// returns a Promise resolving to Html code.
export function server({ disable_server_side_rendering, render, render_html, url, store })
{
	// I guess no one actually disabled their server side rendering
	// so this if condition may be removed (along with the flag) in the future
	if (disable_server_side_rendering)
	{
		return Promise.resolve({ markup: default_server_render({ html }) })
	}

	// return a Promise
	//
	// (not using `promisify()` helper here 
	//  to avoid introducing dependency on `bluebird` Promise library)
	//
	return new Promise((resolve, reject) =>
	{
		// perform routing for this `url`
		store.dispatch(match(url, (error, redirect_location, router_state) =>
		{
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

			// routing process failed
			if (error)
			{
				return reject(error)
			}

			// don't know what this if condition is for
			if (!router_state)
			{
				return reject(new Error('No router state'))
			}

			// one can set a `status` prop for a react-router `Route`
			// to be returned as an Http response status code (404, etc)
			const get_http_response_status_code_for_the_chosen_route = matched_routes =>
			{
				return matched_routes.reduce((previous, current) => (current && current.status) || (previous && current.status))
			}

			// routing process succeeded.
			// render the page's React component.
			store.getState().router.then(() => 
			{
				// Http response status code
				const status = get_http_response_status_code_for_the_chosen_route(router_state.routes)

				// render the page's React component
				resolve
				({
					status, 
					markup: '<!doctype html>\n' + ReactDOMServer.renderToString(render_html(render(<ReduxRouter/>, {store})))
				})
			})
			.catch(error =>
			{
				// log.error(error)
				// error.markup = default_server_render({ render_html }) // let client render error page or re-request data
				reject(error)
			})
		}))
	})
}