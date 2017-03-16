// Not part of package.json
// import querystring from 'query-string'
// import deep_equal from 'deep-equal'

import { parsePath } from 'history/lib/PathUtils'

export function location_url(location)
{
	if (typeof location === 'string')
	{
		return location
	}

	const search = location.search ? location.search : ''
	const hash   = location.hash   ? location.hash   : ''

	// Should be fixed since using `react-router/lib/createMemoryHistory` on the server side now.
	// // https://github.com/ReactTraining/react-router/issues/4023
	// if (!search && location.query && Object.keys(location.query).length > 0)
	// {
	// 	search = `?${querystring.stringify(location.query)}`
	// }

	return `${location.pathname}${search}${hash}`
}

export function parse_location(location)
{
	if (typeof location === 'string')
	{
		return parsePath(location)
	}

	return location
}