import { useCallback } from 'react'
import useLocationHistory from './useLocationHistory.js'

export default function useGoBack(delta) {
	const locationHistory = useLocationHistory()

	const goBack = useCallback((delta = 1) => {
		if (delta < 1) {
			throw new Error('`delta` argument can\'t be less than `1`')
		}
		locationHistory.go(-delta)
	}, [locationHistory])

	return goBack
}