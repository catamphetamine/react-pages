import { matchRoutes } from '../../router/index.js'
import Router from '../../router/client/Router.js'
import { isServerSideLoaded } from '../../client/flags.js'
import { startHotReload } from '../hotReload.js'
import { clearInContext } from '../../context.js'

// Renders the current page React element inside the `to` DOM element.
//
// Returns a `Promise` resolving to `{ store, component }`,
// where `component` is the rendered React component
// and `store` is the Redux store.
//
export default function render({ store }) {
	return matchRoutes(store).then((renderArgs) => {
		// The first pass of initial client-side render
		// was to render the markup which matches server-side one.
		// The second pass is about rendering after resolving `getData`.
		clearInContext('InitialPage/RepeatingServerSideRenderOnClientSide')
		clearInContext('InitialPage/SkipLoad')

		// // `routes` are used when comparing `instantBack` chain items
		// // for resetting `instantBack` chain when the same route is encountered twice.
		// setInContext('...RouteComponents..., renderArgs.routeIndices)

		return {
			element: Router({
				...renderArgs,
				dispatch: store.dispatch,
				getState: store.getState
			}),
			rootComponentProps: { store },

			// The rest of the properties here will be available for a developer in the `result` object
			// returned from the client-side `render()` function.

			// Redux `store` could be used to "hot-reload" reducers via Webpack Hot Module Replacement.
			enableHotReload: () => startHotReload({ store })
		}
	})
}