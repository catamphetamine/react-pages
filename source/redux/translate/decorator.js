export const TRANSLATE_LOCALES_PROPERTY  = '__translation__'

// Hasn't been tested.
// Is a "proof-of-concept".
export default function translate(locales) {
	return function(Component) {
		Component[TRANSLATE_LOCALES_PROPERTY] = locales
		return Component
	}
}