import React from 'react'
import ReactDOM from 'react-dom'

import reactRender from '../../../client/reactRender.js'

import InitialLoad from './InitialLoad.js'

export const onHideListeners = []

export const isHidden = { current: false }
export const showTimer = { current: undefined }

export default function showInitialLoad({
	Component,
	showDelay,
	hideAnimationDuration
}) {
	const show = () => {
		const container = document.createElement('div')
		// containers.push(container)

		// Will prepend `element` to `<body/>` (even if `<body/>` is empty).
		// https://stackoverflow.com/questions/2007357/how-to-set-dom-element-as-the-first-child
		document.body.insertBefore(container, document.body.firstChild)

		// const setRef = (ref) => {
		// 	// Update the `ref` that corresponds to the `container`.
		// 	const index = containers.indexOf(container)
		// 	if (index >= 0) {
		// 		refs[index] = ref
		// 	}
		// }

		const { root } = reactRender(
			React.createElement(InitialLoad, {
				Component,
				hideAnimationDuration,
				// ref: setRef,
				onHidden: () => {
					// https://github.com/facebook/react/issues/21441#issuecomment-833298271
					// ReactDOM.unmountComponentAtNode(container)
					root.unmount()
					document.body.removeChild(container)
				},
				addHiddenListener: (listener) => {
					if (isHidden.current) {
						listener()
						return () => {}
					}
					onHideListeners.push(listener)
					return () => {
						const i = onHideListeners.indexOf(listener)
						if (i >= 0) {
							onHideListeners.splice(i, 1)
						}
					}
				}
			}),
			container
		)
	}

	showTimer.current = setTimeout(show, showDelay)
}
