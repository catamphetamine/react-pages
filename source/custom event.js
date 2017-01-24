// Polyfill for creating CustomEvents on IE9/10/11

let CustomEvent = typeof window !== 'undefined' ? window.CustomEvent : undefined

try
{
	const event = new CustomEvent('test')
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
	CustomEvent = function(event_name, options)
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
					get: () => true
				})
			}
			catch (error)
			{
				this.defaultPrevented = true
			}
		}

		return event
	}

	if (typeof window !== 'undefined')
	{
		CustomEvent.prototype = window.Event.prototype
		window.CustomEvent = CustomEvent
	}
}

export default CustomEvent