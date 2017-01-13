import { exists, is_object } from '../../helpers'

// Asynchronous middleware (e.g. for HTTP Ajax calls).
//
// Takes effect only if the `dispatch`ed action has 
// `promise` function and `events` (or `event`) property.
//
// `dispatch()` call will return a `Promise`.
//
export default function asynchronous_middleware(http_client, { asynchronous_action_event_naming })
{
	return ({ dispatch, getState }) =>
	{
		return next => action =>
		{
			let { promise, event, events, ...rest } = action

			// If the dispatched action doesn't have a `promise` field then do nothing
			if (!promise)
			{
				return next(action)
			}

			// Validate `promise` parameter
			if (typeof promise !== 'function')
			{
				// throw new Error(`"promise" property must be a function returning a promise`)
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

					throw error
				}
			)
		}
	}
}