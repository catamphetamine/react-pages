import React from 'react'

// `@catamphetamine/found` is a fork of `found` with some changes:
// * `redux` and `react-redux` are `peerDependencies` instead of `dependencies`.
// * `farce` was replaced with `@catamphetamine/farce`.
// * Fixed a bug when `found` ignores all navigation actions until its `componentDidMount()` is called.
import { createRender } from '@catamphetamine/found'

export default createRender({
	// Seems to be ignored.
	renderError: ({ error }) => {
		return React.createElement('div', undefined, 'Error')
	}
})