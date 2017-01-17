import React from 'react'
import createHistory from 'history/lib/createBrowserHistory'
import { useRouterHistory } from 'react-router'

import _create_history from './history'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is intended to be wrapped by another function
// which (in turn) is gonna be called from the project's code on the client-side.
//
export default function client_side_render({ history, render, render_parameters = {}, wrapper, translation })
{
	// Make sure authentication token global variable is erased
	// (in case it hasn't been read and erased before)
	authentication_token()

	// Initialize locale
	const locale = window._locale
	if (locale)
	{
		delete window._locale
	}

	// Localized messages
	let messages = window._locale_messages
	if (messages)
	{
		delete window._locale_messages
	}

	// renders current React page.
	// returns the rendered React page component.
	function render_page()
	{
		// Returns a Promise for React component.
		//
		return render
		({
			...render_parameters,
			to: document.getElementById('react'),
			create_page_element : async (element, props = {}) =>
			{
				// If no i18n is required, then simply create Page element
				if (!locale)
				{
					return React.createElement(wrapper, props, element)
				}

				// Translation loading function may be passed
				// (its main purpose is to enable Webpack HMR
				//  in dev mode for translated messages)
				if (translation)
				{
					messages = await translation(locale)
				}

				// Load translations and then create page element

				props.locale   = locale
				props.messages = messages

				// Create React page element
				return React.createElement(wrapper, props, element)
			}
		})
	}

	// Render page (on the client side).
	//
	// Client side code can then rerender the page any time
	// through obtaining the `rerender()` function from the result object.
	//
	return render_page().then(result =>
	{
		result.rerender = render_page
		return result
	})
}

// Reads authentication token from a global variable
// and then erases that global variable
export function authentication_token()
{
	const token = window._authentication_token

	if (token)
	{
		delete window._authentication_token
	}

	return token
}

// Create `react-router` `history`
export function create_history(location, settings)
{
	// Adds 'useBasename' and 'useQueries'
	return _create_history(useRouterHistory(createHistory), location, settings.history)
}