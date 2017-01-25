import { readState, saveState } from 'history/lib/DOMStateStorage'
import { PUSH, REPLACE } from 'history/lib/Actions'

// https://github.com/taion/react-router-scroll/blob/master/src/StateStorage.js
const SCROLL_STATE_KEY_PREFIX = '@@scroll|'

// Replaces the current URL in the browser address bar (and in the history)
export function replace_location(location, history)
{
	return set_location(location, history, REPLACE)
}

// Replaces the current URL in the browser address bar (pushing it to the history)
export function push_location(location, history)
{
	return set_location(location, history, PUSH)
}

// Replaces the current URL in the browser address bar (pushing it to the history)
function set_location(location, history, method)
{
	// A little bit of a fight with `scroll-behavior` here
	const key = history.createKey()
	saveState(`${SCROLL_STATE_KEY_PREFIX}${key}`, get_scroll())
	location = history.createLocation(location, method, key)
	location.scroll = false
	history.transitionTo(location)
}

// Gets window scroll position
function get_scroll()
{
	// Works in IE 10+
	return [window.pageXOffset, window.pageYOffset]
}

// // https://github.com/mjackson/history/blob/v3.x/modules/createHistory.js
// function createKey()
// {
// 	return Math.random().toString(36).substr(2, 6)
// }
