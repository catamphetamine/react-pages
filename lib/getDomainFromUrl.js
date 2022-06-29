export default function getDomainFromUrl(url) {
	// Strip protocol from URL.
	// "https://yandex.ru" -> "yandex.ru".
	const schemaIndex = url.indexOf('://')
	if (schemaIndex >= 0) {
		url = url.slice(schemaIndex + '://'.length)
	}

	// Strip "same protocol" URL prefix.
	// "//yandex.ru" -> "yandex.ru".
	if (url.indexOf('//') === 0) {
		url = url.slice('//'.length)
	}

	// Strip URL path.
	// "yandex.ru/example?a=b" -> "yandex.ru".
	const slashIndex = url.indexOf('/')
	if (slashIndex >= 0) {
		url = url.slice(0, slashIndex)
	}

	// Strip port number from URL.
	// "yandex.ru:80" -> "yandex.ru".
	const colonIndex = url.indexOf(':')
	if (colonIndex >= 0) {
		url = url.slice(0, colonIndex)
	}

	return url
}