import React, { useState, useRef, useEffect, useImperativeHandle } from 'react'
import ReactDOM from 'react-dom'

import { Loading } from '../../components/Loading.js'
import reactRender from '../../client/reactRender.js'

// In cases when the initial page immediately redirects
// to another page (for example, to a "not found" page),
// a `RedirectException` is thrown in `setUpAndRender()` function
// in which case that function re-runs from scratch.
//
// That would result in `showInitialPreload()` function
// getting called multiple times, resulting in it creating
// multiple `<LoadingContainer/>` DOM Elements.
//
// Therefore, when calling `hideInitialPreload()`,
// it should assume there're multiple initial preloaders on apage.

// let containers = []
// let refs = []

const onHideInitialPreloadListeners = []
const shouldShowInitialPreload = true

function LoadingContainer({ onHidden, addHiddenListener }, ref) {
	const [loading, setLoading] = useState(true)

	// const onFinishedLoadingCallback = useRef()
	const onHiddenTimer = useRef()

	// // Provides a `setLoading()` instance method.
	// useImperativeHandle(ref, () => ({
	// 	setFinishedLoading: (callback) => {
	// 		onFinishedLoadingCallback.current = callback
	// 		setLoading(false)
	// 	}
	// }), [
	// 	onFinishedLoadingCallback,
	// 	setLoading
	// ])

	// useEffect(() => {
	// 	if (!loading) {
	// 		onFinishedLoadingCallback.current()
	// 		onFinishedLoadingCallback.current = undefined
	// 	}
	// }, [loading])

	const onHide = () => {
		setLoading(false)
		onHiddenTimer.current = setTimeout(onHidden, 160)
	}

	useEffect(() => {
		if (!shouldShowInitialPreload) {
			onHide()
		} else {
			addHiddenListener(onHide)
		}
		return () => {
			clearTimeout(onHiddenTimer.current)
		}
	}, [])

	return React.createElement(Loading, {
		initial: loading,
		immediate: loading,
		pending: loading
	})
}

LoadingContainer = React.forwardRef(LoadingContainer)

export function showInitialPreload() {
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
		React.createElement(LoadingContainer, {
			// ref: setRef,
			onHidden: () => {
				// https://github.com/facebook/react/issues/21441#issuecomment-833298271
				// ReactDOM.unmountComponentAtNode(container)
				root.unmount()
				document.body.removeChild(container)
			},
			addHiddenListener: (listener) => {
				onHideInitialPreloadListeners.push(listener)
			}
		}),
		container
	)
}

export function hideInitialPreload() {
	// const container = containers.pop()
	// const ref = refs.pop()

	// ref.setFinishedLoading(() => {
	// 	setTimeout(() => {
	// 		ReactDOM.unmountComponentAtNode(container)
	// 		document.body.removeChild(container)
	// 	}, 160)
	// })

	for (const onHideInitialPreloadListener of onHideInitialPreloadListeners) {
		onHideInitialPreloadListener()
	}
}