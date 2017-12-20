import React, { Component } from 'react'
import hoist_statics from 'hoist-non-react-statics'

import { get_display_name } from '../utility'
import { On_page_loaded_method_name } from './middleware/preload'

// `@onPageLoaded()` decorator.
//
// `function onPageLoaded({ dispatch, getState, location, parameters, history, server })`.
//
export default function onPageLoaded(on_page_loaded, options)
{
	return function(Decorated_component)
	{
		class OnPageLoaded extends Component
		{
			render()
			{
				return <Decorated_component {...this.props} />
			}
		}

		OnPageLoaded[On_page_loaded_method_name] = on_page_loaded

		OnPageLoaded.displayName = `OnPageLoaded(${get_display_name(Decorated_component)})`
		
		return hoist_statics(OnPageLoaded, Decorated_component)
	}
}