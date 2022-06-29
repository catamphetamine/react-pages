import Container from './Container.js'

// Normalizes common settings
export default function normalizeSettings(settings)
{
	if (settings === undefined) {
		throw new Error(`Common settings weren't passed.`)
	}

	if (typeof settings !== 'object') {
		throw new Error(`Expected a settings object, got ${typeof settings}: ${settings}`)
	}

	if (!settings.store) {
		if (!settings.routes) {
			throw new Error(`"routes" parameter is required`)
		}

		if (!settings.reducers) {
			throw new Error(`"reducers" parameter is required`)
		}
	}

	return {
		...settings,

		// Default `container` wraps everything in a Redux `<Provider/>`.
		container: settings.container || Container,

		// Default value for `parseDates` is `true`.
		parseDates: settings.parseDates === false ? false : true,

		// HTTP client settings.
		http: {
			...settings.http,

			// `settings.authentication` parameter was moved to `settings.http.authentication`.
			authentication: settings.http && settings.http.authentication || settings.authentication || {}
		}
	}
}