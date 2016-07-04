import React from 'react'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is intended to be wrapped by another function
// which (in turn) is gonna be called from the project's code on the client-side.
//
export default function localize_and_render({ development, render_parameters = {}, render_on_client, markup_wrapper, load_localized_messages })
{
	// Initialize locale
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
		return render_on_client
		({
			...render_parameters,
			development,
			create_page_element : (element, props = {}) =>
			{
				// if no i18n is required, then simply create Page element
				if (!locale)
				{
					return Promise.resolve(React.createElement(markup_wrapper, props, element))
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
					return React.createElement(markup_wrapper, props, element)
				})
			},
			to: document.getElementById('react')
		})
	}

	// Render page (on the client side).
	//
	// Client side code can then rerender the page any time
	// through obtaining the `rerender()` function from the result object.
	//
	return render_page().then(component => ({ rerender: render_page }))
}