import Http_client from '../http client'

// Customization of `http` utility
// which can be used inside Redux action creators
export function set_up_http_client(http_client, { store, on_before_send })
{
	if (on_before_send)
	{
		http_client.on_before_send(function(request)
		{
			// If using Redux, then add `store` as a parameter 
			// for `http_client` customization function
			on_before_send(request, { store })
		})
	}
}

export function create_http_client(settings, authentication_token, options = {})
{
	return new Http_client
	({
		format_url  : settings.http && settings.http.url,
		parse_dates : settings.parse_dates,
		authentication_token,
		authentication_token_header: settings.authentication ? settings.authentication.header : undefined,
		...options
	})
}