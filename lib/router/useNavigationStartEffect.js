import { useEffect } from 'react'

export default function useNavigationStartEffect(onNavigate) {
	useEffect(() => {
		const addListener = () => {
			if (!window._ReactPages_Navigation_Start_Listeners) {
				window._ReactPages_Navigation_Start_Listeners = []
			}
			window._ReactPages_Navigation_Start_Listeners.push(onNavigate)
		}
		const removeListener = () => {
			if (window._ReactPages_Navigation_Start_Listeners) {
				window._ReactPages_Navigation_Start_Listeners = window._ReactPages_Navigation_Start_Listeners.filter(_ => _ !== onNavigate)
			}
		}
		addListener()
		return () => {
			removeListener()
		}
	}, [])
}