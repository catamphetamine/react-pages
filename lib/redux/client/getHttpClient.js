// Returns `http` utility on client side.
// Can be used in WebSocket message handlers,
// since they only run on the client side.
export default function getHttpClient() {
	return window._ReactPages_HttpClient
}