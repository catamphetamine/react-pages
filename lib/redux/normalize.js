import DefaultRootComponent from './DefaultRootComponent.js'

// Normalizes common settings
export default function normalizeSettings(settings) {
	if (settings === undefined) {
		throw new Error(`[react-pages] Common settings weren't passed.`)
	}

	if (typeof settings !== 'object') {
		throw new Error(`[react-pages] Expected a settings object, got ${typeof settings}: ${settings}`)
	}

	if (!settings.routes) {
		throw new Error(`[react-pages] "routes" parameter is required`)
	}

	if (!settings.reducers) {
		// throw new Error(`"reducers" parameter is required`)
		settings.reducers = {}
	}

	if (!settings.http) {
		settings.http = {}
	}

	if (settings.showLoadingInitially) {
		throw new Error(`[react-pages] "showLoadingInitially" parameter was replaced with "InitialLoadComponent" parameter`)
	}

	if (settings.InitialLoadComponent) {
		if (typeof settings.initialLoadHideAnimationDuration !== 'number') {
			throw new Error(`[react-pages] "initialLoadHideAnimationDuration" parameter is required when using "InitialLoadComponent"`)
		}
		if (typeof settings.initialLoadShowDelay !== 'number') {
			throw new Error(`[react-pages] "initialLoadShowDelay" parameter is required when using "InitialLoadComponent"`)
		}
	}

	if (settings.container) {
		throw new Error(`[react-pages] "container" parameter was renamed to "rootComponent"`)
	}

	if (settings.onError) {
		throw new Error(`[react-pages] "onError" parameter was renamed to "onLoadError"`)
	}

	// `settings.parseDates` property was renamed to `settings.http.findAndConvertIsoDateStringsToDateInstances`.
	if (typeof settings.parseDates === 'boolean') {
		if (typeof settings.http.findAndConvertIsoDateStringsToDateInstances !== 'boolean') {
			settings.http.findAndConvertIsoDateStringsToDateInstances = settings.parseDates
			settings.parseDates = undefined
		}
	}

	return {
		...settings,

		// The default `rootComponent` wraps everything in a Redux `<Provider/>`.
		rootComponent: settings.rootComponent || DefaultRootComponent,

		// HTTP client settings.
		http: {
			...settings.http,

			// The default value for `findAndConvertIsoDateStringsToDateInstances` is historically `true`.
			findAndConvertIsoDateStringsToDateInstances: settings.http.findAndConvertIsoDateStringsToDateInstances === false ? false : true,

			// `settings.authentication` parameter was moved to `settings.http.authentication`.
			authentication: settings.http && settings.http.authentication || settings.authentication || {}
		}
	}
}