// Returns `http` utility on client side.
// Can be used in WebSocket message handlers,
// since they only run on the client side.
export default function getHttpClient() {
	return window._react_pages_http_client
}