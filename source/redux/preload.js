import React, { Component } from 'react'
import hoist_statics from 'hoist-non-react-statics'

import { Preload_method_name, Preload_options_name } from './middleware/preloading middleware'

// `@preload()` decorator.
//
// `preload` function must return a `Promise`.
// `function preload({ dispatch, getState, location, parameters, server })`.
//
// The decorator also receives `options`:
//
// * `blocking` — if `false` then child `<Route/>` `@preload()`s
//                will not wait for this `@preload()` to finish first
//
// * `client` — if `true` then this `@preload()` will be executed only on the client side
//              including the moment when the page is initially loaded.
//
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