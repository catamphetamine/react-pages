// Returns a complete `path` for matched route chain.
// E.g. returns "/user/:userId/post/:postId"
// for matched URL "/user/1/post/123?key=value".
export default function getRoutePath(routes)
{
	return routes
		// Select routes having `path` React property set.
		.filter(route => route.path)
		// Trim leading or trailing slashes (`/`)
		// from each route `path` React property.
		// There can be leading or trailing slashes
		// because there're no such restrictions
		// when a developer defines a route's `path`:
		// the `found` router library normalizes those `path`s.
		.map(route => route.path.replace(/^\//, '').replace(/\/$/, ''))
		// // Replace parameters: "/a/:param/b" → "/a/{param}/b".
		// .map(routePart => routePart.replace(/:([^\/]+)/g, '{$1}')
		// Join route `path`s with slashes (`/`).
		.join('/') || '/'
}