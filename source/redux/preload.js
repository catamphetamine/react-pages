import React, { Component } from 'react'
import hoist_statics from 'hoist-non-react-statics'

import { Preload_method_name, Preload_options_name } from './middleware/preloading middleware'

// @preload() decorator
export default function(preload, options)
{
	return function(Wrapped)
	{
		class Preload extends Component
		{
			render()
			{
				return <Wrapped {...this.props} />
			}
		}

		Preload[Preload_method_name]  = preload
		Preload[Preload_options_name] = options

		Preload.displayName = `Preload(${get_display_name(Wrapped)})`
		
		return hoist_statics(Preload, Wrapped)
	}
}

function get_display_name(Wrapped)
{
	return Wrapped.displayName || Wrapped.name || 'Component'
}