import React, { useState, useRef, useEffect, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'

const shouldShowInitialLoad = true

export default function InitialLoad({
	Component,
	onHidden,
	addHiddenListener,
	hideAnimationDuration
}, ref) {
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
		onHiddenTimer.current = setTimeout(onHidden, hideAnimationDuration)
	}

	useEffect(() => {
		let removeOnHideListener
		if (shouldShowInitialLoad) {
			removeOnHideListener = addHiddenListener(onHide)
		} else {
			onHide()
		}
		return () => {
			if (removeOnHideListener) {
				removeOnHideListener()
			}
			clearTimeout(onHiddenTimer.current)
		}
	}, [])

	return React.createElement(Component, {
		initial: true,
		show: loading,
		hideAnimationDuration
	})
}

InitialLoad = React.forwardRef(InitialLoad)

InitialLoad.propTypes = {
	Component: PropTypes.elementType,
	onHidden: PropTypes.func.isRequired,
	addHiddenListener: PropTypes.func.isRequired,
	hideAnimationDuration: PropTypes.number
}