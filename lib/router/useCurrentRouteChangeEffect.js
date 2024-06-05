import { useEffect, useRef } from 'react'

import { takeFromContext, getFromContext, setInContext } from '../context.js'
import clearNavigationState from './clearNavigationState.js'

export default function useCurrentRouteChangeEffect({
	currentRoute,
	prevPage,
	newPage
}) {
	// When a new location (page) has been rendered.
	useEffectOnChange((currentRoute, { isInitialChange: isInitialPageRender }) => {
		// When running in `<StrictMode/>`, React mounts and unmounts "effects" twice.
		// That's why `Root/PrevPage` and `Root/NewPage` are only set here, when an actual change happens.
		// Otherwise, `Root/PrevPage` would be the same as `Root/NewPage` as a result of executing the code below twice.
		setInContext('Root/PrevPage', prevPage)
		setInContext('Root/NewPage', newPage)

		// Clear any navigation-related context info
		// because the navigation has finished.
		clearNavigationState()

		// These listeners, if uncommented, should be snapshotted at the time of evaluating the dependencies.
		// Otherwise, by the time the new page gets mounted, its own "after navigated to another page" listener
		// will also be added to the list of listeners, so a weird situation would occur:
		// "after navigated to another page" listener of the new page would be triggered upon navigating to it.
		//
		// // Trigger navigation end listeners (for previous page).
		// const afterNavigatedToAnotherPageListeners = takeFromContext('Navigation/AfterNavigatedToAnotherPage')
		// if (afterNavigatedToAnotherPageListeners) {
		// 	if (isInitialPageRender) { // Why is this `if` condition here. Maybe remove it. Or change it.
		// 		for (const listener of afterNavigatedToAnotherPageListeners) {
		// 			listener(newPage)
		// 		}
		// 	}
		// }

		// Trigger navigation end listeners (for new page).
		const afterNavigatedToThisPageListeners = takeFromContext('Navigation/AfterRenderedThisPage')
		if (afterNavigatedToThisPageListeners) {
			for (const listener of afterNavigatedToThisPageListeners) {
				listener(newPage)
			}
		}

		// Trigger "after new page has been rendered" listeners.
		const afterRenderedNewPageListeners = getFromContext('Root/AfterRenderedNewPage')
		if (afterRenderedNewPageListeners) {
			for (const listener of afterRenderedNewPageListeners) {
				listener(newPage, prevPage)
			}
		}
	}, [currentRoute])
}

function useEffectOnChange(callback, dependencies) {
	if (dependencies.length !== 1) {
		throw new Error('The `dependencies` array of `useEffectOnChange()` hook should only contain a single dependency')
	}

	const value = dependencies[0]

	// This variable prevents the effect from triggering multiple times for same page.
	// I.e. the effect would only run on the actual change vs randomly.
	//
	// The `ref` is initialized with `undefined` rather than `currentRoute.current`.
	// That is to trigger `useEffect()` below at the initial page render.
	//
	const prevValue = useRef()

	// `isInitialChange` variable is created here — outside of the effect —
	// to store "is initial page load" value that is derived from a `ref` value.
	// The reason is that the `ref` value, when referenced from inside `useEffect()` callback,
	// will always point to the very latest value in that `ref` at not to the `ref` value
	// that existed at the time of comparing the dependencies of the effect.
	// In other words, `ref` value inside effect callback might go out of sync with
	// itself at the time of evaluating the effect's dependencies.
	//
	// Using a variable allows "capturing" the `ref` value at a certain point in time
	// and then use that value later when the effect's callback function is run.
	// This is called "closure" in javascript language.
	//
	// For example, user navigates from `/items` to `/items/123` and "new page" event
	// is registered here, and `useEffect()` is ready to be run but the user quickly
	// navigates to `/contacts` page and all the `ref`s now store the values for that
	// `/contacts` page and not for the `/items/123` page, so the `useEffect()` callback
	// shouldn't read any values from those `ref`s since those `ref` values may have
	// already been overwritten.
	//
	const isInitialChange = !prevValue.current

	useEffect(() => {
		if (value !== prevValue.current) {
			prevValue.current = value
			callback(value, { isInitialChange })
		}
	}, [value])
}