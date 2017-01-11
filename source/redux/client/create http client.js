import Http_client from '../../http client'

// `http` utility can be used inside Redux action creators
export default function create_http_client(common, authentication_token)
{
	return new Http_client
	({
		format_url  : common.http && common.http.url,
		parse_dates : common.parse_dates,
		authentication_token,
		authentication_token_header: common.authentication ? common.authentication.header : undefined
	})
}