import useNavigationListenerEffect from './useNavigationListenerEffect.js'
import { useIsRootRoute } from './NonRootRouteContext.js'

export default function useBeforeRenderNewPage(listener) {
	const isRootRoute = useIsRootRoute()
	if (!isRootRoute) {
		throw new Error('`useBeforeRenderNewPage()` hook can only be used in a "root" route component')
	}
	useNavigationListenerEffect({
		contextKey: 'Root/BeforeRenderNewPage',
		listener
	})
}