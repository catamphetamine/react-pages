// Not part of package.json
// import querystring from 'query-string'
// import deep_equal from 'deep-equal'

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

// Doesn't construct `query` though
export function parse_location(location)
{
	if (typeof location !== 'string')
	{
		return location
	}

	let pathname = location
	let search = ''
	let hash = ''

	const search_index = pathname.indexOf('?')
	if (search_index >= 0)
	{
		pathname = pathname.slice(0, search_index)
		search   = pathname.slice(search_index)
	}

	const hash_index = search.indexOf('#')
	if (hash_index >= 0)
	{
		search = search.slice(0, hash_index)
		hash   = search.slice(hash_index)
	}

	return { pathname, search, hash }
}