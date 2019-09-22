export const ON_PAGE_LOADED_METHOD_NAME = 'onLoaded'

// `@onPageLoaded()` decorator is deprecated, set a static
// `onLoaded` property on a page component instead.
//
// `function onPageLoaded({ dispatch, getState, location, params, server })`.
//
export default function onPageLoaded(onPageLoaded, options) {
	return function(Component) {
		Component[ON_PAGE_LOADED_METHOD_NAME] = onPageLoaded
		return Component
	}
}