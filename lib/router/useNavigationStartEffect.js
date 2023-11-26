import { useEffect } from 'react'

import { setInContext, getFromContext } from '../context.js'

export default function useNavigationStartEffect(onNavigate) {
	useEffect(() => {
		const addListener = () => {
			if (!getFromContext('App/NavigationStartListeners')) {
				setInContext('App/NavigationStartListeners', [])
			}
			setInContext('App/NavigationStartListeners', getFromContext('App/NavigationStartListeners').concat([onNavigate]))
		}
		const removeListener = () => {
			if (getFromContext('App/NavigationStartListeners')) {
				setInContext('App/NavigationStartListeners', getFromContext('App/NavigationStartListeners').filter(_ => _ !== onNavigate))
			}
		}
		addListener()
		return () => {
			removeListener()
		}
	}, [])
}