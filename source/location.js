import querystring from 'query-string'
import deep_equal from 'deep-equal'

// https://github.com/ReactTraining/react-router/issues/4023
export function location_url(location)
{
	let search = ''

	if (location.search)
	{
		search = location.search
	}

	if (!search && location.query)
	{
		search = `?${querystring.stringify(location.query)}`
	}

	return location.pathname + search
}

// Checks if two `location`s are the same
export function locations_are_equal(a, b)
{
	if (a.pathname !== b.pathname)
	{
		return false
	}

	if (a.search !== b.search)
	{
		return false
	}

	if (!deep_equal(a.query, b.query))
	{
		return false
	}

	return true
}