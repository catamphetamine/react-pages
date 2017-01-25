export const Redirect  = '@@react-isomorphic-render/redirect'
export const GoTo      = '@@react-isomorphic-render/goto'
export const Navigated = '@@react-isomorphic-render/navigated'
export const Preload   = '@@react-isomorphic-render/preload'

// Before page preloading started
export const redirect_action = location => preload_action(location, true)

// Before page preloading started
export const goto_action = location => preload_action(location)

// After page preloading finished
export const navigated_action = (location) =>
({
	type: Navigated,
	location
})

// Starts `location` page preloading.
// If `redirect` is `true` then will perform
// `history.replace()` instead of `history.push()`.
export const preload_action = (location, redirect, navigate) =>
({
	type: Preload,
	location,
	redirect,
	navigate
})

// After page preloading finished
export const history_redirect_action = (location) =>
({
	type: Redirect,
	location
})

// After page preloading finished
export const history_goto_action = (location) =>
({
	type: GoTo,
	location
})