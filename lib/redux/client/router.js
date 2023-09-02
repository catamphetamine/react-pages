let foundRouterIsReady = false
const onFoundRouterReadyListeners = []

// Fixes a bug when `found` ignores all navigation actions until its `componentDidMount()` is called.
//
// The code here is the first half of the workaround.
// The second half of the workaround is the added code in `found`'s `src/createBaseRouter.tsx` file:
//
// componentDidMount() {
//   if (typeof window !== 'undefined') {
//     if (window.onFoundRouterIsReady) {
//       window.onFoundRouterIsReady()
//     }
//   }
// }
//
// https://github.com/catamphetamine/found/commit/be416e3bc0715207f861fb5466ed666e9d7c016c
//
if (typeof window !== 'undefined') {
  window.onFoundRouterIsReady = () => {
  	if (!foundRouterIsReady) {
  		foundRouterIsReady = true
  		for (const onFoundRouterReadyListener of onFoundRouterReadyListeners) {
  			onFoundRouterReadyListener()
  		}
  	}
  }
}

export function onFoundRouterReady(listener) {
	if (foundRouterIsReady) {
		return listener()
	} else {
		return new Promise((resolve) => {
			onFoundRouterReadyListeners.push(() => resolve(listener()))
		})
	}
}