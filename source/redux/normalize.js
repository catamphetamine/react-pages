import React from 'react'
import { Provider } from 'react-redux'

import { clone } from '../helpers'

// Normalizes common settings
export default function normalize_common_settings(settings, options = {})
{
	if (settings === undefined)
	{
		throw new Error(`Common settings weren't passed.`)
	}

	if (typeof settings !== 'object')
	{
		throw new Error(`Expected a settings object, got ${typeof settings}: ${settings}`)
	}

	settings = clone(settings)

	if (options.full !== false)
	{
		if (!settings.routes)
		{
			throw new Error(`"routes" parameter is required`)
		}

		if (!settings.reducer)
		{
			throw new Error(`"reducer" parameter is required`)
		}
	}

	if (!settings.wrapper)
	{
		// By default it wraps everything with Redux'es `<Provider/>`.
		settings.wrapper = function Wrapper({ store, children })
		{
			return (
				<Provider store={ store }>
					{ children }
				</Provider>
			)
		}
	}

	// Legacy setting support for 12.x.
	// Deprecated.
	// Will be removed in some next major release.
	if (settings.asynchronousActionEventNaming)
	{
		settings.reduxEventNaming = settings.asynchronousActionEventNaming
		delete settings.asynchronousActionEventNaming
	}

	// Legacy setting support for 12.x.
	// Deprecated.
	// Will be removed in some next major release.
	if (settings.asynchronousActionHandlerStatePropertyNaming)
	{
		settings.reduxPropertyNaming = settings.asynchronousActionHandlerStatePropertyNaming
		delete settings.asynchronousActionHandlerStatePropertyNaming
	}

	// camelCase aliasing
	if (settings.reduxEventNaming)
	{
		settings.redux_event_naming = settings.reduxEventNaming
		delete settings.reduxEventNaming
	}

	// camelCase aliasing
	if (settings.reduxPropertyNaming)
	{
		settings.redux_property_naming = settings.reduxPropertyNaming
		delete settings.reduxPropertyNaming
	}

	// camelCase aliasing
	if (settings.reduxMiddleware)
	{
		settings.redux_middleware = settings.reduxMiddleware
		delete settings.reduxMiddleware
	}

	// camelCase aliasing
	if (settings.reduxStoreEnhancers)
	{
		settings.redux_store_enhancers = settings.reduxStoreEnhancers
		delete settings.reduxStoreEnhancers
	}

	// camelCase aliasing
	if (settings.parseDates !== undefined)
	{
		settings.parse_dates = settings.parseDates
		delete settings.parseDates
	}

	// Default value for `parse_dates` is `true`
	if (settings.parse_dates !== false)
	{
		settings.parse_dates = true
	}

	if (!settings.history)
	{
		settings.history = {}
	}

	// Default history options (non-empty)
	if (!settings.history.options)
	{
		settings.history.options = {}
	}

	if (!settings.http)
	{
		settings.http = {}
	}

	if (!settings.authentication)
	{
		settings.authentication = {}
	}

	return settings
}