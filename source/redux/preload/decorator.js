export const PRELOAD_METHOD_NAME = 'load'

// This decorator is deprecated, use `load`
// static property on a page component instead.
//
// `@preload(preloader, [options])` decorator.
//
// `preloader` function must return a `Promise` (or be `async`):
//
// `function preloader({ dispatch, getState, location, params, server })`.
//
// The decorator also receives an optional `options` argument (advanced topic):
//
// * `blocking` — If `false` then all child routes  `@preload()`s will not
//                wait for this `@preload()` to finish in order to get executed
//                (is `true` by default).
//
// * `blockingSibling` — If `true` then all further adjacent (sibling) `@preload()`s
//                       for the same routes component will wait for this
//                       `@preload()` to finish in order to get executed.
//                       (is `true` by default).
//
// * `client`   — If `true` then the `@preload()` will be executed only on client side.
//                Otherwise the `@preload()` will be executed normally:
//                if part of initial page preloading then on server side and
//                if part of subsequent preloading (e.g. navigation) then on client side.
//
// * `server`   — If `true` then the `@preload()` will be executed only on server side.
//                Otherwise the `@preload()` will be executed normally:
//                if part of initial page preloading then on server side and
//                if part of subsequent preloading (e.g. navigation) then on client side.
//
export default function preload(load, options) {
	return function(Component) {
		// Since there can be several `@preload()`s
		// on a single component, using arrays here.
		Component[PRELOAD_METHOD_NAME] = Component[PRELOAD_METHOD_NAME] || []
		Component[PRELOAD_METHOD_NAME].unshift({
			load,
			...options
		})
		return Component
	}
}