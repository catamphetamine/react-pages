import useNavigationListenerEffect from './useNavigationListenerEffect.js'
import { useIsLeafRoute } from './LeafRouteContext.js'

export default function useAfterRenderedThisPage(listener) {
	const isLeafRoute = useIsLeafRoute()
	if (!isLeafRoute) {
		throw new Error('`useAfterRenderedThisPage()` hook can only be used in a "leaf" route component')
	}
	useNavigationListenerEffect({
		contextKey: 'Navigation/AfterRenderedThisPage',
		listener
	})
}