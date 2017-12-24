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

// `@preload(preloader, [options])` decorator.
//
// `preloader` function must return a `Promise` (or be `async`):
//
// `function preloader({ dispatch, getState, location, parameters, server })`.
//
// The decorator also receives an optional `options` argument (advanced topic):
//
// * `client`   — If `true` then the `@preload()` will be executed only on client side.
//                If `false` then this `@preload()` will be executed normally:
//                if part of initial page preloading then on server side and
//                if part of subsequent preloading (e.g. navigation) then on client side.
//                `false` is the default value unless overridden
//                by `preload.client` configuration parameter.
//
// * `blocking` — If `false` then child `<Route/>`'s  `@preload()`s will not wait
//                for this `@preload()` to finish in order to get executed
//                (`blocking` is `true` by default in such cases).
//                As for the same `<Route/>`'s `@preload()`s,
//                the behaviour is opposite: it's `false` by default.
//                The reason is several `@preload()`s are added
//                when they're being differentiated by the
//                `{ client: false }` / `{ client: true }` flag,
//                and in those cases it makes sense to execute them simultaneously.
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

		// Since there can be several `@preload()`s
		// on a single component, using arrays here.

		if (!Preload[Preload_method_name])
		{
			Preload[Preload_method_name] = []
		}

		if (!Preload[Preload_options_name])
		{
			Preload[Preload_options_name] = []
		}

		Preload[Preload_method_name].push(preload)
		Preload[Preload_options_name].push(options)

		// Component naming for React DevTools
		Preload.displayName = `Preload(${get_display_name(Decorated_component)})`
		
		// Keep all React-specific static methods
		return hoist_statics(Preload, Decorated_component)
	}
}

// `@preload()` reducer
export function reducer(state = { pending : false, immediate : false }, action = {})
{
	switch (action.type)
	{
		case Preload_started  : return { ...state, pending: true,  immediate : action.immediate || false, error: undefined }
		case Preload_finished : return { ...state, pending: false, immediate : false }
		case Preload_failed   : return { ...state, pending: false, immediate : false, error: action.error }
		default               : return state
	}
}

// Can be called manually to show the loading screen.
// E.g. when the user has been logged in
// and calling `window.location.reload()`.
export const indicate_loading = () =>
({
  type      : Preload_started,
  immediate : true
})