import getRoutePath from './getRoutePath.js'

export default function validateRoutes(routes) {
	if (routes.length !== 1) {
		throw new Error('[react-pages] `routes` must be an array with one element')
	}

	if (!(routes[0].Component || routes[0].getComponent)) {
		throw new Error('[react-pages] Root route must have a `Component` or a `getComponent`')
	}

	// If `routes` is an array then it means that the routes configuration
	// is a JSON one rather than a React Element one.
	// In older versions of `react-router` they used to configure routes
	// not as JSON objects but as React Elements (weird).
	if (!Array.isArray(routes)) {
		throw new Error('[react-pages] `routes` must be a JSON structure')
	}

	// The `if` block below validated that there's no `getData` function
	// already associated to the top-level route in the chain.
	// That `if` block was eventually commented out. The reason is that
	// if there's an error on client side in `setUpAndRender()`
	// then `setUpAndRender()` gets called again in order to render the error page.
	// And in that case `getData` will already be set on `routes[0]`
	// and the `if` condition would be valid resulting in throwing the error.
	// So throwing the error was commented out.
	// if (routes[0].getData) {
	// 	throw new Error('[react-pages] `getData` found on the root route')
	// }

	// Validate that `.load()` or `.meta()` functions could only be defined
	// at "root" or "leaf" route `Component`s (page components).
	validateThatMetaOrLoadAreOnlyAtLeafRoutes(routes)
}

function validateThatMetaOrLoadAreOnlyAtLeafRoutes(routes, parentRoutes = []) {
	for (const route of routes) {
		if (route.children) {
			// This is a non-"leaf" route.

			// If it's a non-root route.
			if (parentRoutes.length > 0) {
				const validateHasNoProperty = (propertyName) => {
					const throwError = (type) => {
						throw new Error(`[react-pages] Only root or leaf route${type === 'component' ? ' Component' : ''}s could have a \`${propertyName}\` parameter. A non-leaf route${type === 'component' ? ' Component' : ''} was found having a \`${propertyName}\` parameter for route "${getRoutePath(parentRoutes.concat(route))}"`)
					}
					if (route.Component) {
						if (route.Component[propertyName]) {
							throwError('component')
						}
					} else if (route.getComponent) {
						if (route[propertyName]) {
							throwError('route')
						}
					}
				}

				validateHasNoProperty('load')
				validateHasNoProperty('meta')
			}

			// Recurse into child routes.
			validateThatMetaOrLoadAreOnlyAtLeafRoutes(route.children, parentRoutes.concat([route]))
		} else {
			// This is a "leaf" route.
			if (!(route.Component || route.getComponent)) {
				throw new Error(`[react-pages] Route "${getRoutePath(parentRoutes.concat(route))}" must have a \`Component\` or a \`getComponent\``)
			}
		}
	}
}