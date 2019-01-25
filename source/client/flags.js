export function isServerSidePreloaded() {
	return window._server_side_render && !window._react_website_reload_data
}

export function isServerSideRendered() {
	return window._server_side_render && !window._empty_server_side_render
}