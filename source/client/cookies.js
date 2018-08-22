// https://learn.javascript.ru/cookie
export function getCookie(name)
{
	const matches = document.cookie.match(new RegExp(
		'(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
	))
	if (matches) {
		return decodeURIComponent(matches[1])
	}
}