export function getLanguageFromLocale(locale)
{
	const dashIndex = locale.indexOf('-')
	if (dashIndex >= 0) {
		return locale.slice(0, dashIndex)
	}
	return locale
}