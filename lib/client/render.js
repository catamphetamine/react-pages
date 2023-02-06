import React from 'react'

import reactRender, { hydrate } from './reactRender.js'

import { isServerSidePreloaded, isServerSideRendered } from './flags.js'

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
			window._ReactPages_Page_HotReloadInProgress = true
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
			window._ReactPages_Page_HotReloadInProgress = false
			return rest
		})
	}
	// Render the page on the client side.
	return renderPage().then((result) => ({
		// Redux `store`, for example.
		...result,
		// Deprecated. Don't use.
		rerender: renderPage
	}))
}

function renderReactElementTree(element, to) {
	// If using React >= 16 and the content is Server-Side Rendered.
	if (isServerSidePreloaded() && isServerSideRendered()) {
		// An API introduced in React 16
		// for "hydrating" Server-Side Rendered markup.
		// https://reactjs.org/docs/react-dom.html#hydrate
		hydrate(element, to)
		return
	}
	// Clears `element` to prevent React warning:
	// "Calling ReactDOM.render() to hydrate server-rendered markup
	//  will stop working in React v17. Replace the ReactDOM.render() call
	//  with ReactDOM.hydrate() if you want React to attach to the server HTML."
	if (!window._ReactPages_Page_HotReloadInProgress) {
		while (to.firstChild) {
			to.removeChild(to.firstChild)
		}
	}
	reactRender(element, to)
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