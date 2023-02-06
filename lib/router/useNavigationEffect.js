import { useEffect } from 'react'

export default function useNavigationEffect(onNavigate) {
	useEffect(() => {
		const addListener = () => {
			if (!window._ReactPages_Navigation_Listeners) {
				window._ReactPages_Navigation_Listeners = []
			}
			window._ReactPages_Navigation_Listeners.push(onNavigate)
		}
		const removeListener = () => {
			if (window._ReactPages_Navigation_Listeners) {
				window._ReactPages_Navigation_Listeners = window._ReactPages_Navigation_Listeners.filter(_ => _ !== onNavigate)
			}
		}
		addListener()
		return () => {
			removeListener()
		}
	}, [])
}