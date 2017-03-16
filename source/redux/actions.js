import { parse_location } from '../location'

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
	location: parse_location(location)
})

// Starts `location` page preloading.
//
// If `redirect` is `true` then will perform
// `history.replace()` instead of `history.push()`.
//
// If `navigate` is `false` then the actual navigation won't take place.
// This is used for the server side.
//
// If `initial_client_side_preload` is `true`
// then just client-side-only `@preload()`s will be executed.
//
export const preload_action = (location, redirect, navigate, initial_client_side_preload) =>
({
	type: Preload,
	location: parse_location(location),
	redirect,
	navigate,
	initial: initial_client_side_preload
})

// After page preloading finished
export const history_redirect_action = (location) =>
({
	type: Redirect,
	location: parse_location(location)
})

// After page preloading finished
export const history_goto_action = (location) =>
({
	type: GoTo,
	location: parse_location(location)
})