import { parse_location } from '../../location'

export const Preload_started  = '@@react-website/redux/preload-started'
export const Preload_finished = '@@react-website/redux/preload-finished'
export const Preload_failed   = '@@react-website/redux/preload-failed'

export const Preload   = '@@react-website/preload'

// Can be called manually to show the loading screen.
// E.g. when the user has been logged in
// and calling `window.location.reload()`.
export const indicate_loading = () =>
({
	type      : Preload_started,
	immediate : true
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
export const start_preload = (location, redirect, navigate = true, initial_client_side_preload, instant_back) =>
({
	type     : Preload,
	location : parse_location(location),
	redirect,
	navigate,
	initial  : initial_client_side_preload,
	instant_back
})