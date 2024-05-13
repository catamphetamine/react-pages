// import useNavigationListenerEffect from './useNavigationListenerEffect.js'
// import { useIsLeafRoute } from './LeafRouteContext.js'
//
// export default function useAfterNavigatedToAnotherPage(listener) {
// 	const isLeafRoute = useIsLeafRoute()
// 	if (!isLeafRoute) {
// 		throw new Error('`useAfterNavigatedToAnotherPage()` hook can only be used in a "leaf" route component')
// 	}
// 	useNavigationListenerEffect({
// 		contextKey: 'Navigation/AfterNavigatedToAnotherPage',
// 		listener,
//
// 		// It has to not remove the listener on unmount because otherwise the listener wouldn't ever be called.
// 		// The reason is that by the time the new page has been rendered, the old one is already unmounted
// 		// and because of that its listeners would already have been removed when not passing `unlistenOnUnmount: false` parameter.
// 		//
// 		// Not removing the listener on unmount is fine becase it won't be accidentally re-added
// 		// by accidentally re-running `useEffect()` on the old page because it has already been unmounted.
// 		//
// 		unlistenOnUnmount: false
// 	})
// }