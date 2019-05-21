import HttpClient from '../HttpClient'

export default function createHttpClient(settings, getStore, options = {}) {
	let on_before_send
	let catch_to_retry
	let get_access_token

	// Add `getState()` to `http.onRequest()` parameters.
	if (settings.http.onRequest) {
		on_before_send = (request, parameters) => {
			settings.http.onRequest(request, {
				...parameters,
				getState: getStore().getState
			})
		}
	}

	// Add `store` and `http` helpers to `http.catch`
	if (settings.http.catch) {
		catch_to_retry = (error, retryCount, helpers) => {
			return settings.http.catch(error, retryCount, helpers)
			// {
			// 	...helpers,
			// 	store: getStore()
			// })
		}
	}

	// Add `store` helper to `authentication.accessToken`
	if (settings.authentication.accessToken) {
		get_access_token = (getCookie, helpers) => {
			return settings.authentication.accessToken({
				...helpers,
				getCookie,
				getState: getStore().getState
			})
		}
	}

	return new HttpClient({
		on_before_send,
		catch_to_retry,
		get_access_token,
		transform_url               : settings.http.transformURL,
		// `allowAbsoluteURLs` flag is deprecated.
		allow_absolute_urls         : settings.http.allowAbsoluteURLs,
		parseDates                  : settings.parseDates,
		authentication_token_header : settings.authentication.header,
		...options
	})
}