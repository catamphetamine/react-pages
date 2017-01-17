// Concatenated `react-router` route string.
// E.g. "/user/:user_id/post/:post_id"
export default function get_route_path(router_state)
{
	return router_state.routes
		.filter(route => route.path)
		.map(route => route.path.replace(/^\//, '').replace(/\/$/, ''))
		.join('/') || '/'
}