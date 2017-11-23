import React from 'react'
import ReactDOM from 'react-dom'

// Performs client-side React application rendering.
// Takes `render()` function which renders the actual page.
// Then this rendered page is wrapped with a `wrapper`
// (e.g. Redux state `<Connector/>` and such).
// This function is not exported and is not called directly in an application:
// instead specific implementations call this function
// providing their own `render()` logic
// (e.g. Redux + React-router, React-router).
//
export default async function render({ render, render_parameters = {}, wrapper, translation, history })
{
	// Protected cookie feature
	const protected_cookie_value = get_global_variable('_protected_cookie_value')

	// Internationalization feature
	const locale   = get_global_variable('_locale')
	const messages = get_global_variable('_locale_messages')

	// Renders current React page (wrapped).
	// Returns a Promise for an object holding
	// `render` function for development mode hot reload,
	// protected cookie value,
	// and also `store` (if Redux is used).
	async function render_wrapped_page()
	{
		const { element, wrapper_props, ...rest } = await render(render_parameters)

		// If internationalization feature is used
		if (locale)
		{
			wrapper_props.locale = locale

			// Preload language translation in development mode.
			// `translation` loading function may be passed
			// and its main purpose is to enable Webpack HMR
			// in development mode for translated messages.
			if (translation)
			{
				wrapper_props.messages = await translation(locale)
			} 
		}

		render_react_element
		(
			// Wrap page `element` into a wrapper element.
			// E.g. Redux context `<Provider/>`, and others.
			React.createElement(wrapper, wrapper_props, element),

			// DOM element to which React markup will be rendered
			document.getElementById('react')
		)

		return rest
	}

	// Render the page on the client side.
	const result = await render_wrapped_page()

	return {
		// Redux `store`, for example.
		...result,
		// Client side code can then rerender the page any time
		// by calling this `render()` function
		// (makes hot reload work in development mode).
		rerender: render_wrapped_page,
		// "Protected cookie" could be a JWT "refresh token".
		protectedCookie: protected_cookie_value
	}
}

// Renders React element to a DOM node
function render_react_element(element, to)
{
	// If using React >= 16 and the content is Server-Side Rendered.
	if (ReactDOM.hydrate && window._server_side_rendered)
	{
		// New API introduced in React 16
		// for "hydrating" Server-Side Rendered markup.
		return ReactDOM.hydrate(element, to)
	}

	return ReactDOM.render(element, to)
}

// Retrieves a variable from `window` erasing it.
function get_global_variable(name)
{
	const variable = window[name]
	if (variable !== undefined)
	{
		delete window[name]
	}
	
	return variable
}
