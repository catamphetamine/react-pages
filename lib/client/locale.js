import { getFromContext } from '../context.js'

// Returns user's web browser's preferred locale.
// E.g. `en`, `ru`.
export function getPreferredLocale() {
	if (typeof navigator === 'undefined') {
		return
	}
	// https://developer.mozilla.org/en-US/docs/Web/API/NavigatorLanguage/language
	// `navigator.language` is not supported by Internet Explorer.
	return navigator.language ||
		// For Internet Explorer 11.
		navigator.browserLanguage ||
		// For Internet Explorer 11.
		// The systemLanguage property returns the language edition
		// of the operating system in Internet Explorer.
		navigator.systemLanguage ||
		// For Internet Explorer 11.
		// The userLanguage property returns the current
		// Regional and Language settings of the operating system
		// in Internet Explorer and the language of the browser
		// application in Opera.
		navigator.userLanguage
}

export function getPreferredLocales() {
	return getFromContext('App/Locales') || []
}