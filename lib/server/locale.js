// Based on `koa-locale`
// https://github.com/koa-modules/locale/blob/master/index.js
export function getPreferredLocales(headers) {
	return getLocalesFromHeader(headers['accept-language'])
}

// // From query, `locale=en`
// function getLocaleFromQuery(query) {
// 	return query.locale
// }

// Parses locales from `Accept-Language` HTTP header.
// Copy-pasted from somewhere on stackoverflow.com.
function getLocalesFromHeader(accepts = '') {
	// E.g. "Accept-Language": "da, en-gb;q=0.8, en;q=0.7".
	// Global regular expressions are stateful so it's recreated on each function call.
	const regExp = /(^|,\s*)(?:([a-z]{1,8})(-[A-z]{1,8})?)/g
	const locales = []
	let match
	// Terminates at 10 preferred locales max.
	// (to protect from a possible overflow attack)
	while (locales.length < 10 && (match = regExp.exec(accepts))) {
		let locale = match[2]
		if (match.length > 3 && match[3]) {
			locale += match[3].toUpperCase()
		}
		locales.push(locale)
	}
	return locales
}

// // From cookie, e.g. `locale=zh-CN`
// function getLocaleFromCookie(cookie) {
// 	return cookie
// }