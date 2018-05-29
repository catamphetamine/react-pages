import { parse_location } from '../location'
import { start_preload } from './preload/actions'

export const Redirect  = '@@react-website/redirect'
export const GoTo      = '@@react-website/goto'
export const Navigated = '@@react-website/navigated'
export const LoadState = '@@react-website/redux/state/replace'

// Before page preloading started
export const redirect_action = location => start_preload(location, { redirect: true })

// Before page preloading started
export const goto_action = location => start_preload(location, {})

// After page preloading finished
export const navigated_action = (location) =>
({
	type     : Navigated,
	location : parse_location(location)
})

// After page preloading finished
export const history_redirect_action = (location) =>
({
	type     : Redirect,
	location : parse_location(location)
})

// After page preloading finished
export const history_goto_action = (location) =>
({
	type     : GoTo,
	location : parse_location(location)
})

// Replaces Redux state (e.g. for instant "Back" button feature)
export const load_state_action = (state) =>
({
	type : LoadState,
	state
})