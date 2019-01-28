import React from 'react'
import createRender from 'found/lib/createRender'

// Seems to be ignored.
const render = createRender({
	renderError: ({ error }) => (
		<div>
			Error
		</div>
	)
})

export default render