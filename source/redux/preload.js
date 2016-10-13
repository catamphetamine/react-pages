import React, { Component } from 'react'
import hoist_statics from 'hoist-non-react-statics'

import { Preload_method_name } from './middleware/preloading middleware'

export default function(parameters)
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

		let preload
		// let preload_blocking

		if (typeof parameters === 'function')
		{
			preload = parameters
		}
		else
		{
			throw new Error(`Invalid @preload() parameters: ${parameters}`)
		}

		Preload[Preload_method_name]          = preload
		// Preload[Preload_blocking_method_name] = preload_blocking

		Preload.displayName = `Preload(${get_display_name(Wrapped)})`
		
		return hoist_statics(Preload, Wrapped)
	}
}

function get_display_name(Wrapped)
{
	return Wrapped.displayName || Wrapped.name || 'Component'
}