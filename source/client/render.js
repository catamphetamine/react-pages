import React from 'react'
import ReactDOM from 'react-dom'

import reactRender, { canHydrate, hydrate } from './reactRender'

import { isServerSidePreloaded, isServerSideRendered } from './flags'

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
	let firstRender = true
	// Renders current React page (inside a container).
	// Returns a Promise for an object holding
	// `render` function for development mode hot reload,
	// and also `store` (if Redux is used).
	function renderPage() {
		if (firstRender) {
			firstRender = false
		} else {
			window._react_pages_hot_reload = true
		}
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
			window._react_pages_hot_reload = false
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
		rerender: renderPage
	}))
}

// Renders React element to a DOM node
function renderReactElementTree(element, to) {
	// If using React >= 16 and the content is Server-Side Rendered.
	if (isServerSidePreloaded() && isServerSideRendered() && canHydrate()) {
		// An API introduced in React 16
		// for "hydrating" Server-Side Rendered markup.
		// https://reactjs.org/docs/react-dom.html#hydrate
		return hydrate(element, to)
	}
	// Clears `element` to prevent React warning:
	// "Calling ReactDOM.render() to hydrate server-rendered markup
	//  will stop working in React v17. Replace the ReactDOM.render() call
	//  with ReactDOM.hydrate() if you want React to attach to the server HTML."
	if (!window._react_pages_hot_reload) {
		while (to.firstChild) {
			to.removeChild(to.firstChild)
		}
	}
	return reactRender(element, to)
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