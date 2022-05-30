import React from 'react'
import { createRender } from '@catamphetamine/found'

export default createRender({
	// Seems to be ignored.
	renderError: ({ error }) => {
		return React.createElement('div', undefined, 'Error')
	}
})