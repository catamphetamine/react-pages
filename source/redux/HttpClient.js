import HttpClient from '../HttpClient'

export default function createHttpClient(settings, get_store, options = {})
{
	let on_before_send
	let catch_to_retry
	let get_access_token

	// // Add `getState` to `http.request` parameters.
	// if (settings.http.request)
	// {
	// 	on_before_send = (request) =>
	// 	{
	// 		// If using Redux, then add `store` as a parameter
	// 		// for `http_client` customization function
	// 		settings.http.onBeforeSend(request,
	// 		{
	// 			getState: get_store().getState
	// 		})
	// 	}
	// }

	// Add `store` and `http` helpers to `http.catch`
	if (settings.http.catch)
	{
		catch_to_retry = (error, retryCount, helpers) =>
		{
			return settings.http.catch(error, retryCount, helpers)
			// {
			// 	...helpers,
			// 	store: get_store()
			// })
		}
	}

	// Add `store` helper to `authentication.accessToken`
	if (settings.authentication.accessToken)
	{
		get_access_token = (getCookie, helpers) =>
		{
			return settings.authentication.accessToken(getCookie,
			{
				...helpers,
				store: get_store()
			})
		}
	}

	return new HttpClient
	({
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