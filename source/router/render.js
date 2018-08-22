import React from 'react'
import createRender from 'found/lib/createRender'

const render = createRender({
	renderError: ({ error }) => (
		<div>
			Error
		</div>
	)
})

export default render