import { parseLocation } from '../../location'

export const PRELOAD_STARTED  = '@@react-pages/preload-started'
export const PRELOAD_FINISHED = '@@react-pages/preload-finished'
export const PRELOAD_FAILED   = '@@react-pages/preload-failed'

// Can be called manually to show the loading screen.
// E.g. when the user has been logged in
// and calling `window.location.reload()`.
export const indicateLoading = () =>
({
	type      : PRELOAD_STARTED,
	immediate : true
})