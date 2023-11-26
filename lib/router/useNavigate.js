import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import {
	goto
} from './actions.js'

// Returns a function: `navigateTo(location, { instantBack })`.
export default function useNavigate() {
	const dispatch = useDispatch()

	const navigateTo = useCallback((location, options) => {
		dispatch(goto(location, options))
	}, [dispatch])

	return navigateTo
}