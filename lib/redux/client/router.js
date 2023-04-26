let foundRouterIsReady = false
let onFoundRouterReadyListener

// Fixes a bug when `found` ignores all navigation actions until its `componentDidMount()` is called.
if (typeof window !== 'undefined') {
  window.onFoundRouterIsReady = () => {
  	if (!foundRouterIsReady) {
  		foundRouterIsReady = true
  		if (onFoundRouterReadyListener) {
  			onFoundRouterReadyListener()
  			onFoundRouterReadyListener = undefined
  		}
  	}
  }
}

export function onFoundRouterReady(listener) {
	if (foundRouterIsReady) {
		return listener()
	} else {
		return new Promise((resolve) => {
			onFoundRouterReadyListener = () => resolve(listener())
		})
	}
}