import timer from '../../timer.js'
import mergeMeta from '../../meta/mergeMeta.js'
import { matchRoutes, RedirectException } from '../../router/index.js'
import getRoutePath from '../../router/getRoutePath.js'
import Router from '../../router/server/Router.js'

// Returns a Promise resolving to { status, content, redirect }.
//
export default async function renderOnServer({
	store,
	stash,
	// routes,
	codeSplit
}) {
	// Routing only takes a couple of milliseconds
	// const routingTimer = timer()

	// Profiling
	const time = {}

	const pageLoadTimer = timer()

	let renderArgs
	try {
		renderArgs = await matchRoutes(store)
	} catch (error) {
		// Catches redirects from `load`s,
		// redirects from `settings.onLoadError()` and from `permanentRedirectTo` routes.
		if (error instanceof RedirectException) {
			return {
				redirect: {
					url: error.location,
					statusCode: error.status
				}
			}
		}
		throw error
	}

	time.load = pageLoadTimer()

	// Gather `<title/>` and `<meta/>` tags for this route path
	const { routes, elements } = renderArgs

	const meta = mergeMeta({
		rootMeta: codeSplit ? routes[0].meta : elements[0].type.meta,
		pageMeta: codeSplit ? routes[routes.length - 1].meta : elements[elements.length - 1].type.meta,
		useSelector: (getter) => getter(store.getState()),
		stash
	})

	// Return HTTP status code and the rendered page
	return {
		// Concatenated route `path` string.
		// E.g. "/user/:userId/post/:postId"
		route: getRoutePath(routes),
		status: getHttpResponseStatusCodeForTheRoute(routes),
		content: Router(renderArgs),
		meta,
		rootComponentProps: { store },
		time
	}
}

// One can set a `status` prop for a route
// to be returned as an Http response status code (404, etc)
function getHttpResponseStatusCodeForTheRoute(matchedRoutes)
{
	return matchedRoutes.reduce((previous, current) => (current && current.status) || (previous && current.status), null)
}