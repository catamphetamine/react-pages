import { useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import useNavigationLocation from './navigation/useNavigationLocation.js'

import useLocation from '../router/useLocation.js'

export default function useSelectorForLocation(selector) {
	const location = useLocation()
	const navigationLocation = useNavigationLocation()

	const value = useSelector(selector)

	const latestValueForThisLocation = useRef()
	if (location.pathname === navigationLocation.pathname) {
		latestValueForThisLocation.current = value
	}

	return latestValueForThisLocation.current
}