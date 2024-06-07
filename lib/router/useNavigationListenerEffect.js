import { useEffect, useRef } from 'react'

import { setInContext, getFromContext } from '../context.js'

export default function useNavigationListenerEffect({
	contextKey: key,
	listener
}) {
	useEffect(() => {
		addListener(key, listener)

		// Originally, it was removing the listener in the effect's "clean-up" function.
		// The reason being, React calls effects multiple times in `<StrictMode/>`,
		// so it should remove any listeners it has added when the effect was triggered.
		//
		// But at the same time, hooks like `useAfterNavigatedToAnotherPage()` aren't possible
		// with such implementation because their listeners would be removed before
		// it has finished mounting the new page because the old page is already unmounted by then.
		//
		// As a workaround, for `useAfterNavigatedToAnotherPage()` hook specifically,
		// its listener isn't removed in the effect's "clean-up" function.
		// Instead, adding a listener is "idempotent", i.e. can be called multiple times
		// without resulting in duplicates.
		//
		// All listeners get cleaned automatically after a new page has been rendered.
		//
		return () => {
			removeListener(key, listener)
		}
	}, [])
}

const addListener = (key, listener) => {
	if (!getFromContext(key)) {
		setInContext(key, [])
	}
	// The adding of a `listener` is "idempotent", i.e. calling this function
	// multiple times with the same argument won't result in duplicates.
	const existingListeners = getFromContext(key)
	if (existingListeners.indexOf(listener) < 0) {
		setInContext(key, existingListeners.concat([listener]))
	}
}

const removeListener = (key, listener) => {
	if (getFromContext(key)) {
		setInContext(key, getFromContext(key).filter(_ => _ !== listener))
	}
}