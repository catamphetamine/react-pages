import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import {
	pushLocation,
	replaceLocation,
	navigateThroughHistory
} from './actions.js'

// Returns a `locationHistory` object:
//
// * `locationHistory.push(location)`
// * `locationHistory.replace(location)`
// * `locationHistory.go(delta)`
//
export default function useLocationHistory() {
	const dispatch = useDispatch()

	const push = useCallback((location) => {
		dispatch(pushLocation(location))
	}, [])

	const replace = useCallback((location) => {
		dispatch(replaceLocation(location))
	}, [])

	const go = useCallback((delta) => {
		dispatch(navigateThroughHistory(delta))
	}, [])

	return {
		push,
		replace,
		go
	}
}