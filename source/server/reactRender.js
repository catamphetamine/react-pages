import ReactDOM from 'react-dom/server'

import Stream from './stream'

//-------------------------------------------------------------------
// React 18 things not implemented:
//-------------------------------------------------------------------
// Because the new "Suspense" feature could change Redux state during render,
// Redux state snapshot will have to be appended after the rendered page,
// not before it, as it currently is, because the state could change during render.
//-------------------------------------------------------------------
const USE_REACT_18_API = false

export function createRenderingStream(pageElement) {
	// `ReactDOM.renderToPipeableStream()` is available since React 18.
	// https://github.com/reactwg/react-18/discussions/22
	if (ReactDOM.renderToPipeableStream && USE_REACT_18_API) {
		// Copy-pasted from:
		// https://codesandbox.io/s/github/facebook/react/tree/master/fixtures/ssr2?file=/server/render.js
		let error
		const stream = new Stream()
		const { pipe, abort } = ReactDOM.renderToPipeableStream(pageElement, {
			// React will be ready to stream earlier than this for things like preload tags.
			// However, it won’t be ready to stream the root body tag and shell until it reaches
			// the first Suspense boundary.
			onCompleteShell() {
				if (error) {
					return stream.emit('error', error)
				}
				pipe(stream)
			},
			onError(_error) {
				error = _error
				console.error(error)
			}
		});
		return stream;
	}
	// `ReactDOM.renderToNodeStream()` is available since React 16.
	return ReactDOM.renderToNodeStream(pageElement)
}