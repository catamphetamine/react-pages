import LeafRouteContext from '../router/LeafRouteContext.js'
import RootRouteContext from '../router/RootRouteContext.js'

// The routes structure could specify a top-level "root" route element from which all routes would originate,
// All routes also end with a "leaf" route element that represents the page component.
// * A "root" route element component can use `usePageStateSelectorOutsideOfPage()` hook.
// * A "leaf" route element component should use `usePageStateSelector()` hook instead.
// * A non-"root" and non-"leaf" route element component shouldn't really use either one.
//
export default function transformRouteElements(routeElements, level = 1) {
	return routeElements.map((routeElement) => {
		// Mark "root" route element.
		const isRootRouteElement = level === 1 && routeElements.length === 1 && routeElement.children && routeElement.children.length > 0
		if (isRootRouteElement) {
			routeElement = {
				...routeElement,
				_isRootRoute_: true
			}

			routeElement = wrapRouteElementComponent(routeElement, RootRouteContext.Provider, { value: true })
		}


		// If this isn't a "leaf" route element, recurse into its chidlren.
		if (routeElement.children) {
			routeElement = {
				...routeElement,
				children: transformRouteElements(routeElement.children, level + 1)
			}
		} else {
			// Currently there's no need to mark "leaf" route elements.
			// // Mark the "leaf" route element.
			// routeElement = { ...routeElement, _isLeafRoute_: true }

			// Wrap the "leaf" route element component in a context provider.
			routeElement = wrapRouteElementComponent(routeElement, LeafRouteContext.Provider, { value: true })
		}

		return routeElement
	})
}

function wrapRouteElementComponent(routeElement, wrapperComponent, wrapperComponentProps) {
	// Wraps `component` into a `wrapperComponent`.
	const createWrappedComponent = (component) => {
		return (props) => React.createElement(
			wrapperComponent,
			wrapperComponentProps,
			React.createElement(component, props)
		)
	}

	if (routeElement.Component) {
		return {
			...routeElement,
			Component: createWrappedComponent(routeElement.Component)
		}
	} else if (routeElement.getComponent) {
		const getOriginalComponent = routeElement.getComponent
		return {
			...routeElement,
			getComponent: () => getOriginalComponent().then(createWrappedComponent)
		}
	} else {
		return routeElement
	}
}