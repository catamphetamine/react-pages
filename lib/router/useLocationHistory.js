import { useCallback, useMemo } from 'react'
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
	}, [dispatch])

	const replace = useCallback((location) => {
		dispatch(replaceLocation(location))
	}, [dispatch])

	const go = useCallback((delta) => {
		dispatch(navigateThroughHistory(delta))
	}, [dispatch])

	return useMemo(() => ({
		push,
		replace,
		go
	}), [
		push,
		replace,
		go
	])
}