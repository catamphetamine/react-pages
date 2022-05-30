// Polyfill for creating CustomEvents on IE9/10/11.
//
// Adapted from `custom-event-polyfill` library on October 9th 2017:
// https://github.com/krambuhl/custom-event-polyfill/blob/master/custom-event-polyfill.js

function CustomEvent(event_name, options)
{
	options = options ||
	{
		bubbles    : false,
		cancelable : false,
		detail     : undefined
	}

	// IE 11 way of creating a `CustomEvent`
	const event = document.createEvent('CustomEvent')
	event.initCustomEvent(event_name, options.bubbles, options.cancelable, options.detail)

	// Add `defaultPrevented` flag to the event
	const preventDefault = event.preventDefault
	event.preventDefault = function()
	{
		preventDefault.call(this)

		try
		{
			Object.defineProperty(this, 'defaultPrevented',
			{
				get()
				{
					return true
				}
			})
		}
		catch (error)
		{
			this.defaultPrevented = true
		}
	}

	return event
}

// `window` is `undefined` on server side.
// This file will still be included on server side
// because server side still uses common utilities like
// `meta`, `load`, `redirect()`, `goto()`, etc,
// and therefore it does `require('react-pages')`
// which executes `react-pages/index.common.js`
// which in turn executes this `if` condition.
if (typeof window !== 'undefined')
{
	CustomEvent.prototype = window.Event.prototype
}

export default function PolyfillCustomEvent()
{
	try
	{
		const event = new window.CustomEvent('test')
		event.preventDefault()
		if (event.defaultPrevented !== true)
		{
			// IE has problems with .preventDefault() on custom events
			// http://stackoverflow.com/questions/23349191
			throw new Error('Could not prevent default')
		}
	}
	catch (error)
	{
		// If `CustomEvent` misbehaves (or is absent)
		// then create it from scratch.
		window.CustomEvent = CustomEvent
	}
}