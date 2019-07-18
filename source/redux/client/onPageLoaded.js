export const ON_PAGE_LOADED_METHOD_NAME = '__on_page_loaded__'

// `@onPageLoaded()` decorator.
//
// `function onPageLoaded({ dispatch, getState, location, params, server })`.
//
export default function onPageLoaded(onPageLoaded, options) {
	return function(Component) {
		Component[ON_PAGE_LOADED_METHOD_NAME] = onPageLoaded
		return Component
	}
}