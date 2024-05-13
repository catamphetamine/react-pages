import React from 'react'

// `@catamphetamine/found` is a fork of `found` with some changes:
// * `redux` and `react-redux` are `peerDependencies` instead of `dependencies`.
// * `farce` was replaced with `@catamphetamine/farce`.
// * Fixed a bug when `found` ignores all navigation actions until its `componentDidMount()` is called.
import { createRender } from '@catamphetamine/found'

export default createRender({
	// I dunno what this is.
	// Perhaps it handles imaginary cases when an error occurs somewhere during the routing process.
	renderError: ({ error }) => {
		return React.createElement('div', undefined, 'Error')
	}
})