// Doesn't construct `query` though
export default function parseLocation(location)
{
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

	// `url` is obtained from Node.js `request.url` property,
	// which is always a relative URL.
	// https://nodejs.org/api/http.html#messageurl
	if (origin) {
		throw new Error('[react-pages] `parseLocationUrl()`: A `location` can\'t contain an `origin` property: all locations must be relative')
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

	// return { origin, pathname, search, hash }
	return { pathname, search, hash }
}
