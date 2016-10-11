import React, { Component } from 'react'
import hoist_statics  from 'hoist-non-react-statics'

import { redirect, Preload_method_name } from './index'

export default function onEnter(on_enter)
{
	return function(Wrapped)
	{
		class On_enter extends Component
		{
			render()
			{
				return <Wrapped {...this.props}/>
			}
		}

		On_enter.displayName = `onEnter(${get_display_name(Wrapped)})`

		hoist_statics(On_enter, Wrapped)

		const preloader = On_enter[Preload_method_name]

		On_enter[Preload_method_name] = function on_enter_then_preload(parameters)
		{
			let redirect_to
			const redirect = to => redirect_to = to

			const proceed = () => preloader ? preloader(parameters) : Promise.resolve()

			const on_enter_result = on_enter(parameters, redirect)

			// If it's not a Promise, then just proceed
			if (!on_enter_result.then)
			{
				return proceed()
			}

			return on_enter_result.then(() =>
			{
				if (redirect_to)
				{
					const error = new Error(`Redirecting to ${redirect_to} (this is not an error)`)
					error._redirect = redirect_to
					throw error
				}

				return proceed()
			})
		}

		return On_enter
	}
}

function get_display_name(Wrapped)
{
	return Wrapped.displayName || Wrapped.name || 'Component'
}