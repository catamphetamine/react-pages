export default function forEachRoute(routes, onRoute, parentRoutes = []) {
	for (const route of routes) {
		const routesChain = parentRoutes.concat([route])
		onRoute(route, routesChain)
		if (route.children) {
			forEachRoute(route.children, onRoute, routesChain)
		}
	}
}