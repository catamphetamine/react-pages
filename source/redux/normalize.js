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
	if (common.onNavigate)
	{
		common.on_navigate = common.onNavigate
		delete common.onNavigate
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

	return common
}