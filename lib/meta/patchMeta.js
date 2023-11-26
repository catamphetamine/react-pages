import { getFromContext } from '../context.js'

// (not used)

// Instead of this `patchMeta()` (exported as `updateMeta()`) function,
// developers could theoretically just use the `.meta()` function with the supplied
// `useSelector()` hook, which would update the `<meta/>` tags automatically on changes.
// // If the `found` router calls the `render()` functions for its routes
// // not "outside of the React render process", otherwise it would throw an error:
// // "Invalid hook call. Hooks can only be called inside of the body of a function component".

/**
 * (advanced) (hacking around)
 * This client-side-only function is expored from this library
 * as an `updateMeta()` function. It could be used to "patch"
 * the latest applied `meta` for whatever reason.
 *
 * For example, one project required this type of function when
 * migrating `load()` methods from always being handled by this library
 * to being sometimes handled in a React's `useEffect()` hook
 * as a possible "user experience" enhancement.
 *
 * Another use case would be somehow changing the page's `title`
 * after some additional user-specific data has been loaded in a
 * React's `useEffect()` hook.
 *
 * Or, for example, when `<title/>` gets updated with the count of
 * unread notifications.
 */
export default function patchMeta(newMetaProperties) {
	if (typeof window === 'undefined') {
		throw new Error('[react-pages] `patchMeta()` could only be called on client side')
	}
	applyMeta({
		...getFromContext('App/LatestAppliedMeta'),
		...newMetaProperties
	})
}
