import useNavigationListenerEffect from './useNavigationListenerEffect.js'
import { useIsLeafRoute } from './LeafRouteContext.js'

export default function useBeforeRenderAnotherPage(listener) {
	const isLeafRoute = useIsLeafRoute()
	if (!isLeafRoute) {
		throw new Error('`useBeforeRenderAnotherPage()` hook can only be used in a "leaf" route component')
	}
	useNavigationListenerEffect({
		contextKey: 'Navigation/BeforeRenderAnotherPage',
		listener
	})
}