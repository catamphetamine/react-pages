export function isServerSidePreloaded() {
	return window._server_side_render && !window._ReactPages_Page_ReloadDataOnClientRender
}

export function isServerSideRendered() {
	return window._server_side_render && !window._empty_server_side_render
}