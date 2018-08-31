import React from 'react'
import ReactDOM from 'react-dom'

// Performs client-side React application rendering.
// Takes `render()` function which renders the actual page.
// Then this rendered page is rendered in a `container`
// (e.g. Redux state `<Connector/>` and such).
// This function is not exported and is not called directly in an application:
// instead specific implementations call this function
// providing their own `render()` logic
// (e.g. Redux + React-router, React-router).
//
export default function render({ render, renderParameters = {}, container }) {
	// Protected cookie feature
	const protected_cookie_value = getGlobalVariable('_protected_cookie_value')

	// // Internationalization feature
	// const locale = getGlobalVariable('_locale')

	// Renders current React page (inside a container).
	// Returns a Promise for an object holding
	// `render` function for development mode hot reload,
	// protected cookie value,
	// and also `store` (if Redux is used).
	function renderPage()
	{
		return render(renderParameters).then(({ element, containerProps, ...rest }) => {
			// if (locale) {
			// 	containerProps.locale = locale
			// }

			renderReactElementTree(
				// Render page `element` inside a container element.
				// E.g. Redux context `<Provider/>`, and others.
				React.createElement(container, containerProps, element),

				// DOM element to which React markup will be rendered
				getReactContainerElement()
			)

			return rest
		})
	}

	// Render the page on the client side.
	return renderPage().then((result) => ({
		// Redux `store`, for example.
		...result,
		// Client side code can then rerender the page any time
		// by calling this `render()` function
		// (makes hot reload work in development mode).
		rerender: renderPage,
		// "Protected cookie" could be a JWT "refresh token".
		protectedCookie: protected_cookie_value
	}))
}

// Renders React element to a DOM node
function renderReactElementTree(element, to) {
	// If using React >= 16 and the content is Server-Side Rendered.
	if (ReactDOM.hydrate && window._server_side_render && !window._empty_server_side_render) {
		// New API introduced in React 16
		// for "hydrating" Server-Side Rendered markup.
		return ReactDOM.hydrate(element, to)
	}
	return ReactDOM.render(element, to)
}

// Retrieves a variable from `window` erasing it.
function getGlobalVariable(name) {
	const variable = window[name]
	if (variable !== undefined) {
		delete window[name]
	}
	return variable
}

function getReactContainerElement()
{
	let element = document.getElementById('react')

	if (!element) {
		const body = document.body
		if (!body) {
			throw new Error('<body/> tag not found, make sure this script is added to the end of <body/> rather than inside <head/>.')
		}
		element = document.createElement('div')
		element.setAttribute('id', 'react')
		body.appendChild(element)
	}

	return element
}