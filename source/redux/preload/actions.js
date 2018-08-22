import { parseLocation } from '../../location'

export const PRELOAD_STARTED  = '@@react-website/redux/preload-started'
export const PRELOAD_FINISHED = '@@react-website/redux/preload-finished'
export const PRELOAD_FAILED   = '@@react-website/redux/preload-failed'

// Can be called manually to show the loading screen.
// E.g. when the user has been logged in
// and calling `window.location.reload()`.
export const indicateLoading = () =>
({
	type      : PRELOAD_STARTED,
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
// If `initialClientSidePreload` is `true`
// then just client-side-only `@preload()`s will be executed.
//
export const startPreload = (location,
{
	redirect,
	navigate,
	initialClientSidePreload,
	instantBack,
	instant
}) =>
({
	type     : PRELOAD,
	location : parseLocation(location),
	redirect,
	navigate : navigate === undefined ? true : navigate,
	initial  : initialClientSidePreload,
	instantBack,
	instant
})