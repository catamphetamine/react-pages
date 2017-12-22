import React, { Component } from 'react'
import hoist_statics from 'hoist-non-react-statics'

import { get_display_name } from '../utility'

import {
	Preload_method_name,
	Preload_options_name,
	Preload_started,
	Preload_finished,
	Preload_failed
} from './middleware/preload'

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
export default function preload(preload, options)
{
	return function(Decorated_component)
	{
		class Preload extends Component
		{
			render()
			{
				return <Decorated_component {...this.props} />
			}
		}

		Preload[Preload_method_name]  = preload
		Preload[Preload_options_name] = options

		Preload.displayName = `Preload(${get_display_name(Decorated_component)})`
		
		return hoist_statics(Preload, Decorated_component)
	}
}

export function reducer(state = { pending : false, immediate : false }, action = {})
{
	switch (action.type)
	{
		case Preload_started  : return { ...state, pending: true,  immediate : action.immediate, error: undefined }
		case Preload_finished : return { ...state, pending: false, immediate : false }
		case Preload_failed   : return { ...state, pending: false, immediate : false, error: action.error }
		default               : return state
	}
}

export const indicate_loading = () =>
({
  type      : Preload_started,
  immediate : true
})

// export const preload_finished = () =>
// ({
//   type : Preload_finished
// })