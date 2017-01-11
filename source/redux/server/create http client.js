import Http_client from '../../http client'

// Isomorphic http client (with cookie support)
export default function create_http_client(common, authentication_token, application, request)
{
	return new Http_client
	({
		host          : application ? application.host : undefined,
		port          : application ? application.port : undefined,
		secure        : application ? application.secure : false,
		clone_request : request,
		format_url    : common.http && common.http.url,
		parse_dates   : common.parse_dates,
		authentication_token,
		authentication_token_header: common.authentication ? common.authentication.header : undefined
	})
}