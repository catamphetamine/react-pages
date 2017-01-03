import { clone } from '../helpers'

export function normalize_common_options(common)
{
	if (!common)
	{
		throw new Error(`Common options weren't passed. Perhaps you've upgraded to react-isomorphic-render 4.0.0 in which case check the new API documentation.`)
	}

	common = clone(common)

	if (!common.routes)
	{
		throw new Error(`"routes" parameter is required`)
	}

	if (!common.reducer)
	{
		throw new Error(`"reducer" parameter is required`)
	}

	// camelCase aliasing
	if (common.onStoreCreated)
	{
		common.on_store_created = common.onStoreCreated
		delete common.onStoreCreated
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