import getData from './load/getData.js'

import forEachLeafRoute from '../router/forEachLeafRoute.js'

export default function createGetDataFunctionsForRoutes(routes, {
	stash,
	codeSplit,
	server,
	onLoadError,
	getLocale,
	getCookie,
	context: customContext
}) {
	const getLoadFunction = (route) => codeSplit ? route.load : route.Component.load

	// Set `getData` function on the root route's `Component`.
	// https://4catalyzer.github.io/found/docs/configuration/route-config#data-or-getdata
	if (getLoadFunction(routes[0])) {
		routes[0].getData = createGetDataFunction({
			routePosition: 'root',
			routes,
			codeSplit,
			server,
			onError: onLoadError,
			getLocale,
			getCookie,
			context: customContext,
			stash
		})
	}

	// Set `getData` function on the "leaf" route `Component`s.
	// https://4catalyzer.github.io/found/docs/configuration/route-config#data-or-getdata

	forEachLeafRoute(routes, (leafRoute) => {
		if (getLoadFunction(leafRoute)) {
			leafRoute.getData = createGetDataFunction({
				routePosition: 'leaf',
				routes,
				codeSplit,
				server,
				onError: onLoadError,
				getLocale,
				getCookie,
				context: customContext,
				stash
			})

			// `defer: true` instructs `getData` of this route and all of its descendants
			// to wait for all parent route `getData` promises.
			//
			// "Setting defer on a route will make the resolver defer calling its
			//  getData method and the getData methods on all of its descendants until
			//  all of its parent data promises have resolved."
			//
			// https://4catalyzer.github.io/found/docs/configuration/route-config
			leafRoute.defer = true
		}
	})
}

function createGetDataFunction(parameters) {
	// The `context` parameter is the `matchContext` parameter that's passed in `./lib/router/index.js`.
	// https://4catalyzer.github.io/found/docs/configuration/route-config#data-or-getdata
	return function({ params, context: { dispatch, getState } }) {
		return getData({
			...parameters,
			params,
			dispatch: (action) => {
				// This `if` prevents an error message in console:
				// "Error: Actions may not have an undefined "type" property. You may have misspelled an action type string constant.".
				// That error message was appearing when `{origin: 'load'}` action was dispatched
				// as a result of someone accidentally calling `dispatch()` with no action argument.
				if (action) {
					action = {
						...action,
						// The `origin: "load"` parameter is used in `middleware/asynchronous.js`
						// to detect HTTP calls originating from `load()` functions.
						origin: 'load'
					}
				}
				return dispatch(action)
			},
			getState
		})
	}
}