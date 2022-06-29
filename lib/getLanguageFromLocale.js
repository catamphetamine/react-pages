export default function getLanguageFromLocale(locale) {
	// `ru-RU` -> `ru`.
	// "IETF language tags".
	// https://en.wikipedia.org/wiki/IETF_language_tag
	const dashIndex = locale.indexOf('-')
	if (dashIndex >= 0) {
		return locale.slice(0, dashIndex)
	}
	return locale
}