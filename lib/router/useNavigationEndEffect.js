import { useEffect } from 'react'

import { setInContext, getFromContext } from '../context.js'

export default function useNavigationEndEffect(onNavigate) {
	useEffect(() => {
		const addListener = () => {
			if (!getFromContext('App/NavigationEndListeners')) {
				setInContext('App/NavigationEndListeners', [])
			}
			setInContext('App/NavigationEndListeners', getFromContext('App/NavigationEndListeners').concat([onNavigate]))
		}
		const removeListener = () => {
			if (getFromContext('App/NavigationEndListeners')) {
				setInContext('App/NavigationEndListeners', getFromContext('App/NavigationEndListeners').filter(_ => _ !== onNavigate))
			}
		}
		addListener()
		return () => {
			removeListener()
		}
	}, [])
}