// export function preloadPageAndFetchData(serverClientPreload, clientPreload, clientPreloadDeferred) {
// 	return ({ params, context: { dispatch, getState } }) => {
// 		const server = typeof window === 'undefined'
// 		if (!server && window._react_website_skip_preload) {
// 			return Promise.resolve()
// 		}
// 		const { location, previousLocation } = getLocations(getState())
// 		const isInitialClientSideNavigation = !server && !previousLocation
// 		const parameters = {
// 			dispatch,
// 			getState,
// 			params,
// 			// `parameters` property name is deprecated, use `params` instead.
// 			parameters: params,
// 			location,
// 			server
// 		}
// 		let promise = (serverClientPreload && !isInitialClientSideNavigation) ? serverClientPreload(parameters) : Promise.resolve()
// 		if (server) {
// 			return promise
// 		}
// 		if (clientPreload) {
// 			promise = Promise.all([
// 				promise,
// 				clientPreload(parameters)
// 			])
// 		}
// 		if (clientPreloadDeferred) {
// 			return promise = promise.then(() => clientPreloadDeferred(parameters))
// 		}
// 		return promise
// 	}
// }