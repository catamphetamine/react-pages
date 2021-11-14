import ReactDOM from 'react-dom'

const USE_REACT_18_API = false

export default function reactRender(reactElement, domElement) {
	// `ReactDOM.createRoot()` is available since React 18.
	// https://blog.saeloun.com/2021/07/15/react-18-adds-new-root-api.html
	if (ReactDOM.createRoot && USE_REACT_18_API) {
		const root = ReactDOM.createRoot(domElement)
		return root.render(reactElement)
	}
	return ReactDOM.render(reactElement, domElement)
}

export function canHydrate() {
	// `ReactDOM.createRoot()` is available since React 18.
	if (ReactDOM.createRoot && USE_REACT_18_API) {
		return true
	}
	// `ReactDOM.hydrate()` is available since React 16.
	if (ReactDOM.hydrate) {
		return true
	}
}

export function hydrate(reactElement, domElement) {
	// `ReactDOM.createRoot()` is available since React 18.
	if (ReactDOM.createRoot && USE_REACT_18_API) {
		const root = ReactDOM.createRoot(domElement, { hydrate: true })
		return root.render(reactElement)
	}
	// `ReactDOM.hydrate()` is available since React 16.
	// It "hydrates" Server-Side Rendered markup.
	// https://reactjs.org/docs/react-dom.html#hydrate
	return ReactDOM.hydrate(reactElement, domElement)
}