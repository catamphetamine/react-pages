import { exists, is_object } from '../../helpers'
import { goto_action } from '../actions'

// Asynchronous middleware (e.g. for HTTP Ajax calls).
//
// Takes effect only if the `dispatch`ed action has 
// `promise` function and `events` (or `event`) property.
//
// `dispatch()` call will return a `Promise`.
//
export default function asynchronous_middleware(http_client, asynchronous_action_event_naming, server, on_error)
{
	return ({ dispatch, getState }) =>
	{
		return next => action =>
		{
			let { promise, event, events, ...rest } = action

			// If the dispatched action doesn't have a `promise` function property then do nothing
			if (typeof promise !== 'function')
			{
				return next(action)
			}

			// Generate the three event names automatically based on a base event name
			if (!events && typeof event === 'string')
			{
				events = asynchronous_action_event_naming(event)
			}

			// Validate `events` property
			if (!events || events.length !== 3)
			{
				throw new Error(`"events" property must be an array of 3 event names: e.g. ['pending', 'success', 'error']`)
			}

			// event names
			const [Request, Success, Failure] = events

			// dispatch the `pending` event to the Redux store
			dispatch({ ...rest, type: Request })

			// Run the asychronous action (e.g. an HTTP request)
			const promised = promise(http_client)

			// Validate that `promise()` actually returned a `Promise`
			if (!promised || typeof promised.then !== 'function')
			{
				throw new Error(`"promise" function must return a Promise. Got:`, promised)
			}

			return promised.then
			(
				// If the Promise resolved
				// (e.g. an HTTP request succeeded)
				result =>
				{
					// Dispatch the `success` event to the Redux store
					dispatch
					({
						...rest,
						result,
						type : Success
					})

					// The Promise returned from `dispatch()` call
					// is resolved with the `promise` resolved value.
					return result
				},
				// if the Http request failed
				//
				// (Http status !== 20x
				//  or the Http response JSON object has an `error` field)
				error =>
				{
					// Transform Javascript `Error` instance into a plain JSON object
					// because the meaning of the `error` action is different
					// from what `Error` class is: it should only carry info like
					// `status`, `message` and possible other values (e.g. `code`),
					// without any stack traces, line numbers, etc.
					// I.e. the `error` action should be a plain javascript object,
					// not an instance of an `Error` class, because it's Redux (stateless).

					const error_data = is_object(error.data) ? error.data : {}

					if (!exists(error_data.message))
					{
						error_data.message = error.message
					}

					if (!exists(error_data.status))
					{
						error_data.status = error.status
					}

					// Dispatch the `failure` event to the Redux store
					dispatch
					({
						...rest,
						error : error_data,
						type  : Failure
					})

					// The Promise returned from `dispatch()` call
					// is rejected with this error.

					// if (error.data)
					// {
					// 	delete error.data
					// }
					//
					// for (let key of Object.keys(error_data))
					// {
					// 	error[key] = error_data[key]
					// }

					// Only checks `http` calls which are not part of `@preload()`
					// so that they don't get "error handled" twice
					// (doesn't affect anything, just a minor optimization).
					// Also only checks `http` calls on client side
					// because on server side `http` calls can be
					// either part of `@preload` of part of `initialize`
					// which are already "error handled".
					// On the client side though, an `http` call
					// may be performed via some user input,
					// so it needs this separate case "error handler".
					if (!server && on_error && !event.preloading)
					{
						// Report the error
						// (for example, redirect to a login page
						//  if an Auth0 JWT token expired)
						on_error(error,
						{
							path : window.location.pathname,
							url  : window.location.href,
							// Using `goto` instead of `redirect` here
							// because it's not part of `@preload()`
							// and is therefore part of some kind of an HTTP request
							// triggered by user input (e.g. form submission)
							// which means it is convenient to be able to
							// go "Back" to the page on which the error originated.
							redirect : to => dispatch(goto_action(to)),
							dispatch,
							getState,
							server
						})
					}

					throw error
				}
			)
		}
	}
}