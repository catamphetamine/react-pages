import React, { Component } from 'react'
import hoist_statics from 'hoist-non-react-statics'

/*
  Note:
    When this decorator is used, it MUST be the first (outermost) decorator.
    Otherwise, we cannot find and call the preload and preload_deferred methods.
*/

export default function(parameters)
{
	return function(Wrapped)
	{
		class Wrapper extends Component
		{
			render()
			{
				return <Wrapped {...this.props} />
			}
		}

		let preload
		let preload_deferred
		let preload_blocking

		if (typeof parameters === 'function')
		{
			preload = parameters
		}
		else
		{
			preload          = parameters.preload
			preload_deferred = parameters.deferred
			preload_blocking = parameters.blocking
		}

		Wrapper.preload = preload
		Wrapper.preload_blocking = preload_blocking
		Wrapper.preload_deferred = preload_deferred

		return hoist_statics(Wrapper, Wrapped)
	}
}