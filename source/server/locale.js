// Based on `koa-locale`
// https://github.com/koa-modules/locale/blob/master/index.js
export function get_preferred_locales(headers, cookies)
{
	let locales = []

	// const locale_from_query = getLocaleFromQuery(require('url').parse(request.url, true).query)
	// if (locale_from_query)
	// {
	// 	locales.push(locale_from_query)
	// }

	const locale_from_cookie = getLocaleFromCookie(cookies.locale)
	if (locale_from_cookie)
	{
		locales.push(locale_from_cookie)
	}

	locales = locales.concat(getLocalesFromHeader(headers['accept-language']))

	return locales
}

// // From query, `locale=en`
// function getLocaleFromQuery(query_parameters)
// {
// 	return query_parameters.locale
// }

// From accept-language, `Accept-Language: zh-CN`
function getLocalesFromHeader(accepts = '')
{
	// E.g. "Accept-Language": "da, en-gb;q=0.8, en;q=0.7"
	const regular_expression = /(^|,\s*)(?:([a-z]{1,8})(-[A-z]{1,8})?)/g

	let locales = []

	let match
	// Terminates at 10 preferred locales max
	// (to protect from a possible overflow attack)
	while (locales.length < 10 && (match = regular_expression.exec(accepts)))
	{
		let locale = match[2]

		if (match.length > 3 && match[3])
		{
			locale += match[3].toUpperCase()
		}

		locales.push(locale)
	}

	return locales
}

// From cookie, e.g. `locale=zh-CN`
function getLocaleFromCookie(cookie)
{
	return cookie
}