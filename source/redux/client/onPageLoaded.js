import React, { Component } from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'

import { getDisplayName } from '../../utility'

export const ON_PAGE_LOADED_METHOD_NAME = '__on_page_loaded__'

// `@onPageLoaded()` decorator.
//
// `function onPageLoaded({ dispatch, getState, location, params, server })`.
//
export default function onPageLoaded(onPageLoaded, options) {
	return function(DecoratedComponent) {
		class OnPageLoaded extends Component {
			render() {
				return <DecoratedComponent {...this.props} />
			}
		}
		OnPageLoaded[ON_PAGE_LOADED_METHOD_NAME] = onPageLoaded
		// Component naming for React DevTools
		OnPageLoaded.displayName = `OnPageLoaded(${getDisplayName(DecoratedComponent)})`
		// Keep all non-React-specific static methods
		return hoistNonReactStatics(OnPageLoaded, DecoratedComponent)
	}
}