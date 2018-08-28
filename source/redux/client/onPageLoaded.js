import React, { Component } from 'react'
import hoist_non_react_statics from 'hoist-non-react-statics'

import { getDisplayName } from '../../utility'

export const ON_PAGE_LOADED_METHOD_NAME = '__on_page_loaded__'

// `@onPageLoaded()` decorator.
//
// `function onPageLoaded({ dispatch, getState, location, parameters, server })`.
//
export default function onPageLoaded(on_page_loaded, options)
{
	return function(DecoratedComponent)
	{
		class OnPageLoaded extends Component
		{
			render()
			{
				return <DecoratedComponent {...this.props} />
			}
		}

		OnPageLoaded[ON_PAGE_LOADED_METHOD_NAME] = on_page_loaded

		// Component naming for React DevTools
		OnPageLoaded.displayName = `OnPageLoaded(${getDisplayName(DecoratedComponent)})`

		// Keep all non-React-specific static methods
		return hoist_non_react_statics(OnPageLoaded, DecoratedComponent)
	}
}