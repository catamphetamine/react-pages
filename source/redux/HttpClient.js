import HttpClient from '../HttpClient'

export default function createHttpClient(settings, getStore, options = {}) {
	let onBeforeSend
	let catchToRetry
	let getAuthToken

	// Add `getState()` to `http.onRequest()` parameters.
	if (settings.http.onRequest) {
		onBeforeSend = (request, parameters) => {
			settings.http.onRequest(request, {
				...parameters,
				getState: getStore().getState
			})
		}
	}

	// Add `store` and `http` helpers to `http.catch`
	if (settings.http.catch) {
		catchToRetry = (error, retryCount, helpers) => {
			return settings.http.catch(error, retryCount, helpers)
			// {
			// 	...helpers,
			// 	store: getStore()
			// })
		}
	}

	// Add `store` helper to `authentication.accessToken`
	if (settings.authentication.accessToken) {
		getAuthToken = (getCookie, helpers) => {
			return settings.authentication.accessToken({
				...helpers,
				getCookie,
				getState: getStore().getState
			})
		}
	}

	return new HttpClient({
		onBeforeSend,
		catchToRetry,
		getAuthToken,
		transformUrl: settings.http.transformUrl,
		parseDates: settings.parseDates,
		authTokenHeader: settings.authentication.header,
		...options
	})
}