import useNavigationListenerEffect from './useNavigationListenerEffect.js'
import { useIsRootRoute } from './NonRootRouteContext.js'

export default function useAfterRenderedNewPage(listener) {
	const isRootRoute = useIsRootRoute()
	if (!isRootRoute) {
		throw new Error('`useAfterRenderedNewPage()` hook can only be used in a "root" route component')
	}
	useNavigationListenerEffect({
		contextKey: 'Root/AfterRenderedNewPage',
		listener
	})
}