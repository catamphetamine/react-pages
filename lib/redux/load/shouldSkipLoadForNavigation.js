// A workaround for `found` router bug:
// https://github.com/4Catalyzer/found/issues/239
//
// It skips `load()`:
// * When clicking a "hash" link: `/a?b=c` → `/a?b=c#d`.
// * When navigating "Back" from a "hash" link: `/a?b=c#d` → `/a?b=c`.
// * When navigating "Back"/"Forward" between "hash" links: `/a?b=c#d` → `/a?b=c#e`.
//
// It doesn't skip `load()`:
// * When navigating from `/a?b=c` to `/a?b=c`.
// * When navigating from `/a?b=c` to `/a?b=c2`.
//
export default function shouldSkipLoadForNavigation(fromLocation, toLocation) {
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
