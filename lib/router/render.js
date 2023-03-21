import React from 'react'

// `@catamphetamine/found` is the same as `found`
// with the only change being that `redux` and `react-redux` packages
// were moved from `dependencies` to `peerDependencies` in `package.json`.
import { createRender } from '@catamphetamine/found'

export default createRender({
	// Seems to be ignored.
	renderError: ({ error }) => {
		return React.createElement('div', undefined, 'Error')
	}
})