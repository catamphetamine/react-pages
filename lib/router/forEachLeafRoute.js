export default function forEachLeafRoute(routes, onLeafRoute, parentRoutes = []) {
	for (const route of routes) {
		const routesChain = parentRoutes.concat([route])
		if (route.children) {
			forEachLeafRoute(route.children, onLeafRoute, routesChain)
		} else {
			onLeafRoute(route, routesChain)
		}
	}
}