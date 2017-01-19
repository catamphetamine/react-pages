import React, { Component } from 'react'
import hoist_statics  from 'hoist-non-react-statics'

import { Preload_method_name } from './middleware/preloading middleware'

// This decorator is supposed to be used in conjunction with `preload.catch`,
// because this component will emit either Status 401 Unauthenticated
// or Status 403 Unauthorized if the authorization fails
// which is supposed to be then caught in `preload.catch`
// for further redirection to a corresponding error page.
//
// `get_user(state)` gets a `user` object from Redux state.
// `authorization` is either a String `user.role`,
// or an array of all possible `user.role`s,
// or a function of `user` returning `true`/`false`.
//
export default function authorized_route(get_user, authorization, Wrapped)
{
	// class Authorized extends Component
	// {
	// 	render()
	// 	{
	// 		return <Wrapped { ...this.props }/>
	// 	}
	// }

	function Authorized(props)
	{
		return <Wrapped { ...props }/>
	}

	Authorized.displayName = `Authorize(${get_display_name(Wrapped)})`

	hoist_statics(Authorized, Wrapped)

	const preload = Authorized[Preload_method_name]

	// On the client side the redirection
	// will be made in `componentWillMount()`.
	// On the server side `component` won't neccessarily mount
	// and won't neccessarily be created (e.g. when SSR is turned off)
	// therefore must perform the check in `@preload()`.
	Authorized[Preload_method_name] = function authorize_then_preload(parameters)
	{
		const { getState } = parameters

		const error = check_privileges(get_user(getState()), authorization)

		if (error)
		{
			throw_error(error)
		}

		return preload ? preload(parameters) : Promise.resolve()
	}

	return Authorized
}

function check_privileges(user, authorization)
{
	// Ensure that the user has signed id
	if (!user)
	{
		// not authenticated.
		// redirect the user to the "unauthenticated" page
		return 'unauthenticated'
	}

	// If no further authorization is required,
	// then show the requested page
	if (!authorization)
	{
		return
	}

	// // Normalize `authorization`
	// if (typeof authorization === 'string')
	// {
	// 	authorization = [authorization]
	// }
	//
	// // If the passed parameter is a list of roles,
	// // at least one of which is required to view the page
	// if (Array.isArray(authorization))
	// {
	// 	// if the user has one of the required roles,
	// 	// then show the page
	// 	for (let role of authorization)
	// 	{
	// 		if (user.role === role)
	// 		{
	// 			return
	// 		}
	// 	}
	// }

	// If the passed parameter is a function then evaluate it
	if (typeof authorization === 'function')
	{
		// If the authorization passes,
		// then show the page
		if (authorization(user))
		{
			return
		}
	}

	// authorization not passed.
	// redirect the user to the "unauthorized" page
	return 'unauthorized'
}

function get_display_name(Wrapped)
{
	return Wrapped.displayName || Wrapped.name || 'Component'
}

function throw_error(error_code)
{
	const error = new Error(error_code)
	error.status = error_code === 'unauthenticated' ? 401 : 403
	throw error
}