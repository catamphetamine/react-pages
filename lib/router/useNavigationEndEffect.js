import { useEffect } from 'react'

export default function useNavigationEndEffect(onNavigate) {
	useEffect(() => {
		const addListener = () => {
			if (!window._ReactPages_Navigation_End_Listeners) {
				window._ReactPages_Navigation_End_Listeners = []
			}
			window._ReactPages_Navigation_End_Listeners.push(onNavigate)
		}
		const removeListener = () => {
			if (window._ReactPages_Navigation_End_Listeners) {
				window._ReactPages_Navigation_End_Listeners = window._ReactPages_Navigation_End_Listeners.filter(_ => _ !== onNavigate)
			}
		}
		addListener()
		return () => {
			removeListener()
		}
	}, [])
}