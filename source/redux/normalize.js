import React from 'react'
import { Provider } from 'react-redux'

import { clone } from '../helpers.js'

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

	settings = clone(settings)

	if (!settings.container) {
		// By default it wraps everything with Redux `<Provider/>`.
		settings.container = function Container({ store, children }) {
			return React.createElement(Provider, { store }, children)
		}
	}

	// Default value for `parseDates` is `true`
	if (settings.parseDates !== false) {
		settings.parseDates = true
	}

	if (!settings.http) {
		settings.http = {}
	}

	// (deprecated)
	// `authentication` settings were moved to `http.authentication`.
	if (settings.authentication) {
		settings.http.authentication = settings.authentication
	}

	if (!settings.http.authentication) {
		settings.http.authentication = {}
	}

	return settings
}