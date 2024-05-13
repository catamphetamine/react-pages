import useNavigationListenerEffect from './useNavigationListenerEffect.js'
import { useIsLeafRoute } from './LeafRouteContext.js'

export default function useBeforeNavigateToAnotherPage(listener) {
	const isLeafRoute = useIsLeafRoute()
	if (!isLeafRoute) {
		throw new Error('`useBeforeNavigateToAnotherPage()` hook can only be used in a "leaf" route component')
	}
	useNavigationListenerEffect({
		contextKey: 'Navigation/BeforeNavigateToAnotherPage',
		listener
	})
}