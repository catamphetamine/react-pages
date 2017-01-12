import React from 'react'
import { Provider } from 'react-redux'

import { clone } from '../helpers'

export default function normalize_common_settings(common, options = {})
{
	if (common === undefined)
	{
		throw new Error(`Common settings weren't passed.`)
	}

	if (typeof common !== 'object')
	{
		throw new Error(`Expected a settings object, got ${typeof common}: ${common}`)
	}

	common = clone(common)

	if (options.full !== false)
	{
		if (!common.routes)
		{
			throw new Error(`"routes" parameter is required`)
		}

		if (!common.reducer)
		{
			throw new Error(`"reducer" parameter is required`)
		}
	}

	if (!common.wrapper)
	{
		// By default it wraps everything with Redux'es `<Provider/>`.
		common.wrapper = function Wrapper({ store, children })
		{
			return <Provider store={ store }>{ children }</Provider>
		}
	}

	// camelCase aliasing
	if (common.asynchronousActionEventNaming)
	{
		common.asynchronous_action_event_naming = common.asynchronousActionEventNaming
		delete common.asynchronousActionEventNaming
	}

	// camelCase aliasing
	if (common.asynchronousActionHandlerStatePropertyNaming)
	{
		common.asynchronous_action_handler_state_property_naming = common.asynchronousActionHandlerStatePropertyNaming
		delete common.asynchronousActionHandlerStatePropertyNaming
	}

	// camelCase aliasing
	if (common.reduxMiddleware)
	{
		common.redux_middleware = common.reduxMiddleware
		delete common.reduxMiddleware
	}

	// camelCase aliasing
	if (common.parseDates !== undefined)
	{
		common.parse_dates = common.parseDates
		delete common.parseDates
	}

	// Default value for `parse_dates` is `true`
	if (common.parse_dates !== false)
	{
		common.parse_dates = true
	}

	// For those who don't wish to proxy API requests to API servers
	// and prefer to query those API servers directly (for whatever reasons).
	// Direct API calls will contain user's cookies and HTTP headers (e.g. JWT token).
	//
	// Therefore warn about authentication token leakage
	// in case a developer supplies his own custom `format_url` function.
	//
	if (common.http && common.http.url)
	{
		console.log('[react-isomorphic-render] The default `http.url` formatter only allows requesting local paths therefore protecting authentication token (and cookies) from leaking to a 3rd party. Since you supplied your own `http.url` formatting function, implementing such anti-leak guard is your responsibility now.')
	}

	return common
}