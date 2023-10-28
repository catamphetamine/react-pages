export default function getNavigationLocation(location) {
	return {
		pathname: location.pathname,
		search: location.search,
		hash: location.hash
	}
}