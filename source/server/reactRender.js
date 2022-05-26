import { renderToPipeableStream, renderToNodeStream } from 'react-dom/server'

import Stream from './stream.js'

//-------------------------------------------------------------------
// React 18 things not implemented:
//-------------------------------------------------------------------
// Because the new "Suspense" feature could change Redux state during render,
// Redux state snapshot will have to be appended after the rendered page,
// not before it, as it currently is, because the state could change during render.
//
// Currently, it creates readable streams for `[beforeContent, afterContent]`
// before starting the rendering of the page content.
// Redux state is written in `afterContent`.
// So, a React 18 implementation will have to listen for the React rendering stream's
// "end" and only then generate `afterContent`.
// See `render.js` for the place where `afterContent` is generated.
//
// In case `renderToNodeStream` gets deprecated, it could use `renderToString`.
//-------------------------------------------------------------------
const USE_REACT_18_API = false

export function createRenderingStream(pageElement) {
	// `ReactDOM.renderToPipeableStream()` is available since React 18.
	// https://github.com/reactwg/react-18/discussions/22
	if (renderToPipeableStream && USE_REACT_18_API) {
		// Copy-pasted from:
		// https://codesandbox.io/s/github/facebook/react/tree/master/fixtures/ssr2?file=/server/render.js
		let error
		const stream = new Stream()
		const { pipe, abort } = renderToPipeableStream(pageElement, {
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
	return renderToNodeStream(pageElement)
}