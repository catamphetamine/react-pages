export default function getNavigationLocation(location) {
	return {
		origin: location.origin,
		pathname: location.pathname,
		search: location.search,
		hash: location.hash
	}
}