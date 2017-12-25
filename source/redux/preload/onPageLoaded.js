import React, { Component } from 'react'
import hoist_non_react_statics from 'hoist-non-react-statics'

import { get_display_name } from '../../utility'

export const On_page_loaded_method_name = '__on_page_loaded__'

// `@onPageLoaded()` decorator.
//
// `function onPageLoaded({ dispatch, getState, location, parameters, history, server })`.
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

		OnPageLoaded[On_page_loaded_method_name] = on_page_loaded

		// Component naming for React DevTools
		OnPageLoaded.displayName = `OnPageLoaded(${get_display_name(DecoratedComponent)})`
		
		// Keep all non-React-specific static methods
		return hoist_non_react_statics(OnPageLoaded, DecoratedComponent)
	}
}