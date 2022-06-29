// A workaround for `found` router bug:
// https://github.com/4Catalyzer/found/issues/239
// Skip `load` and other stuff for anchor link navigation.
export default function shouldSkipPreloadForNavigation(fromLocation, toLocation) {
	if (isSameLocationIgnoreHash(fromLocation, toLocation)) {
		// If a "hash" link has been clicked,
		// or if it's a Back/Forward navigation
		// then `load` should be skipped.
		if (toLocation.hash || toLocation.action === 'POP') {
			return true
		}
	}
}

function isSameLocationIgnoreHash(fromLocation, toLocation) {
	return toLocation.origin === fromLocation.origin &&
		toLocation.pathname === fromLocation.pathname &&
		toLocation.search === fromLocation.search
}
