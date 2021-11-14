const TRANSLATE_LOCALES_PROPERTY  = '__translation__'

export default function collectTranslations(components, routes, routeIndices, codeSplit, locale, dispatch) {
	// Set the `_key` for each route.
	// Each page component gets `route` property
	// from which it can get the `_key`
	// and using that `_key` it can get the
	// translation data from Redux state.
	routes.forEach((route, i) => {
		route._key = routeIndices.slice(0, i + 1).join('/')
	})
	const translations = components
		.map((component, i) => ({
			path: routes[i]._key,
			getTranslation: component[TRANSLATE_LOCALES_PROPERTY] && component[TRANSLATE_LOCALES_PROPERTY][locale]
		}))
		.filter(_ => _.getTranslation)
	if (translations.length > 0) {
		return () => Promise.all(translations.map(({ path, getTranslation }) => {
			return getTranslation().then((translation) => dispatch('@@react-pages/translation', {
				path,
				translation
			}))
		}))
	}
}