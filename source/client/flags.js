export function isServerSidePreloaded() {
	return window._server_side_render
}

export function isServerSideRendered() {
	return window._server_side_render && !window._empty_server_side_render
}