import React from 'react'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is intended to be wrapped by another function
// which (in turn) is gonna be called from the project's code on the client-side.
//
export default function localize_and_render({ development, render_parameters = {}, render_on_client, wrapper, translation })
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

	let messages = window._locale_messages
	if (messages)
	{
		delete window._locale_messages
	}

	// renders current React page.
	// returns the rendered React page component.
	function render_page()
	{
		// returns a Promise for React component.
		//
		return render_on_client
		({
			...render_parameters,
			development,
			create_page_element : async (element, props = {}) =>
			{
				// if no i18n is required, then simply create Page element
				if (!locale)
				{
					return React.createElement(wrapper, props, element)
				}

				// translation loading function may be passed
				// (its main purpose is to enable Webpack HMR
				//  in dev mode for translated messages)
				if (translation)
				{
					messages = await translation(locale)
				}

				// load translations and then create page element

				props.locale   = locale
				props.messages = messages

				// create React page element
				return React.createElement(wrapper, props, element)
			},
			to: document.getElementById('react')
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