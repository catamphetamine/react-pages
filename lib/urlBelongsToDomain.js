import getDomainFromUrl from './getDomainFromUrl.js'

export default function urlBelongsToDomain(url, domain) {
	const fullDomain = getDomainFromUrl(url)
	const indexOfDomain = fullDomain.lastIndexOf(domain)
	if (indexOfDomain < 0) {
		return false
	}
	if (indexOfDomain === 0) {
		return true
	}
	return indexOfDomain + domain.length === fullDomain.length
}