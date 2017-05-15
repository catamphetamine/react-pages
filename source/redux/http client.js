import Http_client from '../http client'

export default function create_http_client(settings, get_store, protected_cookie_value, options = {})
{
	let on_before_send
	let catch_to_retry
	let get_access_token

	// Add `store` helper to `http.request`
	if (settings.http.request)
	{
		on_before_send = (request) =>
		{
			// If using Redux, then add `store` as a parameter 
			// for `http_client` customization function
			settings.http.request(request,
			{
				store: get_store()
			})
		}
	}

	// Add `store` and `http` helpers to `http.catch`
	if (settings.http.catch)
	{
		catch_to_retry = (error, retryCount, helpers) =>
		{
			return settings.http.catch(error, retryCount,
			{
				...helpers,
				store: get_store()
			})
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

	return new Http_client
	({
		on_before_send,
		catch_to_retry,
		get_access_token,
		format_url                  : settings.http.url,
		parse_dates                 : settings.parse_dates,
		authentication_token_header : settings.authentication.header,
		protected_cookie            : settings.authentication.protectedCookie,
		protected_cookie_value,
		...options
	})
}