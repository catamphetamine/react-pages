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

export function reducer(state = {}, action = {})
{
	switch (action.type)
	{
		case Preload_started  : return { ...state, pending: true,  error: undefined }
		case Preload_finished : return { ...state, pending: false }
		case Preload_failed   : return { ...state, pending: false, error: action.error }
		default               : return state
	}
}