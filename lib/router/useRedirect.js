import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import {
	redirect
} from './actions.js'

// Returns a function: `redirectTo(location)`.
export default function useRedirect() {
	const dispatch = useDispatch()

	const redirectTo = useCallback((location, options) => {
		dispatch(redirect(location, options))
	}, [dispatch])

	return redirectTo
}