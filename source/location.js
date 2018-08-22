export function getLocationUrl(location, options = {})
{
	if (typeof location === 'string') {
		if (options.basename) {
			location = parseLocation(location)
		} else {
			return location
		}
	}

	const origin   = location.origin || ''
	const pathname = location.pathname
	const search   = location.search || ''
	const hash     = location.hash || ''

	// Append `basename` only to relative URLs
	const basename = (!origin && options.basename) ? options.basename : ''

	return `${origin}${basename}${pathname}${search}${hash}`
}

// Doesn't construct `query` though
export function parseLocation(location)
{
	if (typeof location !== 'string') {
		return location
	}

	let origin
	let pathname

	if (location === '') {
		pathname = '/'
	} else if (location[0] === '/') {
		pathname = location
	} else {
		const pathname_starts_at = location.indexOf('/', location.indexOf('//') + '//'.length)

		if (pathname_starts_at > 0) {
			origin   = location.slice(0, pathname_starts_at)
			pathname = location.slice(pathname_starts_at)
		} else {
			origin   = location
			pathname = '/'
		}
	}

	let search = ''
	let hash = ''

	const search_index = pathname.indexOf('?')
	if (search_index >= 0) {
		search   = pathname.slice(search_index)
		pathname = pathname.slice(0, search_index)
	}

	const hash_index = search.indexOf('#')
	if (hash_index >= 0) {
		hash   = search.slice(hash_index)
		search = search.slice(0, hash_index)
	}

	return { origin, pathname, search, hash }
}