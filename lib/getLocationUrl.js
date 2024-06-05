// Returns the relative URL from `location`.
export default function getLocationUrl(location, options = {}) {
	// In a forked version of `farce` — `@catamphetamine/farce` — there's `origin` property in location.
	// // There's no `location.origin` property because all locations are relative.
	// // https://github.com/4Catalyzer/farce#locations-and-location-descriptors
	// if (location.origin) {
	// 	throw new Error('[react-pages] A `location` can\'t contain an `origin` property: all locations must be relative')
	// }

	// `location` argument within this library is always a `farce` location.
	//
	// A `farce` location always has a `search: string` property.
	// https://github.com/4Catalyzer/farce#locations-and-location-descriptors
	//
	// Because `queryMiddleware` is applied, it will also contain a `query: object`
	// which is gonna be a parsed `search` string.
	// So those two could be used interchangeably.
	//
	const pathname = location.pathname
	const search = location.search || ''
	const hash = location.hash || ''

	// Append `basename` to relative URLs.
	const basename = options.basename || ''

	return `${basename}${pathname}${search}${hash}`
}
