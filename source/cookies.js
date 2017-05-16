// https://learn.javascript.ru/cookie
export function get_cookie_in_a_browser(name)
{
	const matches = document.cookie.match(new RegExp
	(
		'(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
	))

	if (matches)
	{
		return decodeURIComponent(matches[1])
	}
}