import { useRouterHistory } from 'react-router'

import useBeforeUnload from 'history/lib/useBeforeUnload'
import createHistory from 'history/lib/createBrowserHistory'
import { createLocation } from 'history/lib/LocationUtils'
import { readState } from 'history/lib/DOMStateStorage'

import _create_history from '../history'

// Create `react-router` `history`
export default function create_history(location, settings, parameters)
{
	// Adds `useBasename` and `useQueries`
	return _create_history(useRouterHistory(useBeforeUnload(createHistory)), location, settings, parameters)
}

// When a `popstate` event occurs (e.g. a user click "Back" browser button)
// it `@preload()`s the page first and only then renders it.
export function should_instrument_new_popstate_listeners(call_listener)
{
	// A list of tracked instrumented `popstate` listeners
	const pop_state_listeners = []

	// The initial page URL won't have any `event.state` on `popstate`
	// therefore keep it in case the user decides to go "Back" to the very start.
	const initial_location = window.location

	const addEventListener = window._react_website_original_addEventListener = window.addEventListener
	window.addEventListener = function(type, listener, flag)
	{
		// Modify `popstate` listener so that it's called
		// after the `popstate`d page finishes `@preload()`ing.
		if (type === 'popstate')
		{
			const original_listener = listener

			listener = (event) =>
			{
				call_listener(original_listener, event, get_history_pop_state_location(event, initial_location))
			}

			pop_state_listeners.push
			({
				original    : original_listener,
				istrumented : listener
			})
		}

		// Proceed normally
		return addEventListener(type, listener, flag)
	}

	const removeEventListener = window.removeEventListener
	window.removeEventListener = function(type, listener)
	{
		// Untrack the instrumented `popstate` listener being removed
		// and "uninstrument" the listener (restore the original listener).
		if (type === 'popstate')
		{
			for (const pop_state_listener of pop_state_listeners)
			{
				if (pop_state_listener.original === listener)
				{
					// Restore the original listener
					listener = pop_state_listener.istrumented

					// Remove the instrumented `popstate` listener from the list
					pop_state_listeners.splice(pop_state_listeners.indexOf(pop_state_listener), 1)
					break
				}
			}
		}

		// Proceed normally
		return removeEventListener.apply(this, arguments)
	}
}

// Will no longer instrument `popstate` listeners.
export function should_not_instrument_new_popstate_listeners()
{
	window.addEventListener = window._react_website_original_addEventListener
	delete window._react_website_original_addEventListener
}

// Get the `location` of the page being `popstate`d
function get_history_pop_state_location(event, initial_location)
{
	// `event.state` is empty when the user
	// decides to go "Back" up to the initial page.
	if (event.state)
	{
		return get_history_state_location(event.state)
	}

	return initial_location
}

// Gets `location` from a `popstate`d history entry `state`.
// https://github.com/mjackson/history/blob/v3.x/modules/BrowserProtocol.js
function get_history_state_location(history_state)
{
	const key = history_state && history_state.key

	return createLocation
	({
		pathname : window.location.pathname,
		search   : window.location.search,
		hash     : window.location.hash,
		state    : key ? readState(key) : undefined
	},
	undefined,
	key)
}
