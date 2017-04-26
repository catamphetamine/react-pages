import React from 'react'
import createHistory from 'history/lib/createBrowserHistory'
import { createLocation } from 'history/lib/LocationUtils'
import { readState } from 'history/lib/DOMStateStorage'
import { useRouterHistory } from 'react-router'
import useBeforeUnload from 'history/lib/useBeforeUnload'

import _create_history from './history'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is intended to be wrapped by another function
// which (in turn) is gonna be called from the project's code on the client-side.
//
export default function client_side_render({ history, render, render_parameters = {}, wrapper, translation })
{
	const token = authentication_token()
	// Erase the authentication token global variable
	// (so that it's less likely to be stolen via an XSS attack)
	delete window._authentication_token

	// Initialize locale
	const locale = window._locale
	if (locale)
	{
		delete window._locale
	}

	// Localized messages
	let messages = window._locale_messages
	if (messages)
	{
		delete window._locale_messages
	}

	// renders current React page.
	// returns the rendered React page component.
	function render_page()
	{
		// Returns a Promise for React component.
		//
		return render
		({
			...render_parameters,
			to: document.getElementById('react'),
			create_page_element : async (element, props = {}) =>
			{
				// If no i18n is required, then simply create Page element
				if (!locale)
				{
					return React.createElement(wrapper, props, element)
				}

				// Translation loading function may be passed
				// (its main purpose is to enable Webpack HMR
				//  in dev mode for translated messages)
				if (translation)
				{
					messages = await translation(locale)
				}

				// Load translations and then create page element

				props.locale   = locale
				props.messages = messages

				// Create React page element
				return React.createElement(wrapper, props, element)
			}
		})
	}

	// Render page (on the client side).
	//
	// Client side code can then rerender the page any time
	// through obtaining the `rerender()` function from the result object.
	//
	return render_page().then((result) =>
	{
		result.rerender = render_page
		result.token = token
		return result
	})
}

// Reads authentication token from a global variable
// and then erases that global variable
export function authentication_token()
{
	return window._authentication_token
}

// Create `react-router` `history`
export function create_history(location, settings, parameters)
{
	// Adds `useBasename` and `useQueries`
	return _create_history(useRouterHistory(useBeforeUnload(createHistory)), location, settings, parameters)
}

// When a `popstate` event occurs (e.g. via "Back" browser button)
// it `@preload()`s the page first and only then renders the page.
export function always_instrument_history_pop_state_listeners(call_listener)
{
	// A list of tracked instrumented `popstate` listeners
	const pop_state_listeners = []

	// The initial page URL won't have any `event.state` on `popstate`
	// therefore keep it in case the user decides to go "Back" to the very start.
	const initial_location = window.location

	const addEventListener = window.addEventListener
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
