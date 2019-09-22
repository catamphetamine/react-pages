import React from 'react'
import { Provider } from 'react-redux'

import { clone } from '../helpers'

// Normalizes common settings
export default function normalizeSettings(settings)
{
	if (settings === undefined) {
		throw new Error(`Common settings weren't passed.`)
	}

	if (typeof settings !== 'object') {
		throw new Error(`Expected a settings object, got ${typeof settings}: ${settings}`)
	}

	settings = clone(settings)

	if (!settings.routes) {
		throw new Error(`"routes" parameter is required`)
	}

	if (!settings.reducers) {
		throw new Error(`"reducers" parameter is required`)
	}

	if (!settings.container) {
		// By default it wraps everything with Redux `<Provider/>`.
		settings.container = function Container({ store, children }) {
			return (
				<Provider store={store}>
					{children}
				</Provider>
			)
		}
	}

	if (settings.hot) {
		settings.container = settings.hot(module)(settings.container)
	}

	// Default value for `parseDates` is `true`
	if (settings.parseDates !== false) {
		settings.parseDates = true
	}

	if (!settings.http) {
		settings.http = {}
	}

	if (!settings.authentication) {
		settings.authentication = {}
	}

	return settings
}