import { exists, isObject } from '../../helpers'
import { getLocationUrl } from '../../location'
import { goto } from '../../router'
import { DEFAULT_REDUX_EVENT_NAMING } from '../naming'

export const RESULT_ACTION_PROPERTY = 'value'
export const ERROR_ACTION_PROPERTY = 'error'

// Asynchronous middleware (e.g. for HTTP Ajax calls).
//
// Takes effect only if the `dispatch`ed action has
// `promise` function and `events` (or `event`) property.
//
// `dispatch()` call will return a `Promise`.
//
export default function asynchronousMiddleware(
	httpClient,
	reduxEventNaming,
	server,
	onError,
	parseError = defaultParseError
) {
	reduxEventNaming = reduxEventNaming || DEFAULT_REDUX_EVENT_NAMING

	return ({ dispatch, getState }) => {
		return next => action => {
			let {
				promise,
				event,
				events,
				...rest
			} = action

			// If the dispatched action doesn't have a `promise` function property then do nothing
			if (typeof promise !== 'function') {
				return next(action)
			}

			// Generate the three event names automatically based on a base event name
			if (!events && typeof event === 'string') {
				events = reduxEventNaming(event)
			}

			// Validate `events` property
			if (!events || events.length !== 3) {
				throw new Error(`"events" property must be an array of 3 event names: e.g. ['pending', 'success', 'error']`)
			}

			// event names
			const [ Request, Success, Failure ] = events

			// dispatch the `pending` event to the Redux store
			dispatch({ ...rest, type: Request })

			// Run the asychronous action (e.g. an HTTP request)
			const promised = promise({ http: httpClient })

			// Validate that `promise()` actually returned a `Promise`
			if (!promised || typeof promised.then !== 'function') {
				console.error('Redux action\'s "promise" function returned:', promised);
				throw new Error('Redux action\'s "promise" function must return a Promise.')
			}

			// Returning the result like this,
			// because if returned the `promised.then()` chain directly
			// then it wouldn't get detected as an "Unhandled rejection"
			// in case of an error.
			return new Promise((resolve, reject) => {
				// Don't `return` this promise
				// so that it detects it as an "Unhandled rejection"
				// in case of an error.
				promised.then(
					// If the Promise resolved
					// (e.g. an HTTP request succeeded)
					(result) => {
						// Dispatch the `success` event to the Redux store
						dispatch({
							...rest,
							type : Success,
							[RESULT_ACTION_PROPERTY] : result
						})

						// Returning the result like this,
						// because if returned the `promised.then()` chain directly
						// then it wouldn't get detected as an "Unhandled rejection"
						// in case of an error.
						resolve(result)

						// The Promise returned from `dispatch()` call
						// is resolved with the `promise` resolved value.
						return result
					},
					// if the Http request failed
					//
					// (Http status !== 20x
					//  or the Http response JSON object has an `error` field)
					(error) => {
						// Dispatch the `failure` event to the Redux store
						dispatch({
							...rest,
							type : Failure,
							[ERROR_ACTION_PROPERTY] : parseError(error)
						})

						// The Promise returned from `dispatch()` call
						// is rejected with this error.

						// Also only checks `http` calls on client side
						// because on server side `http` calls can be
						// either part of `load` of part of `initialize`
						// which are already "error handled".
						// On the client side though, an `http` call
						// may be performed via some user input,
						// so it needs this separate case "error handler".
						if (!server && onError) {
							const location = getState().found.resolvedMatch.location
							// Report the error
							// (for example, redirect to a login page
							//  if a JWT "access token" expired)
							onError(error, {
								path: location.pathname,
								url: getLocationUrl(location),
								// Using `goto` instead of `redirect` here
								// because it's not part of `load`
								// and is therefore part of some kind of an HTTP request
								// triggered by user input (e.g. form submission)
								// which means it is convenient to be able to
								// go "Back" to the page on which the error originated.
								redirect: to => dispatch(goto(to)),
								dispatch,
								getState,
								server
							})
						}

						// Returning the result (error) like this,
						// because if returned the `promised.then()` chain directly
						// then it wouldn't get detected as an "Unhandled rejection"
						// in case of an error.
						reject(error)

						// Reduce client-side error reporting software (e.g. sentry.io)
						// noise for not-really-errors like "Unauthenticated" and "Unauthorized".
						if (error.status !== 401 && error.status !== 403) {
							throw error
						}
					}
				)
			})
		}
	}
}

// Transform Javascript `Error` instance into a plain JSON object
// because the meaning of the `error` action is different
// from what `Error` class is: it should only carry info like
// `status`, `message` and possible other values (e.g. `code`),
// without any stack traces, line numbers, etc.
// I.e. the `error` action should be a plain javascript object,
// not an instance of an `Error` class, because it's Redux (stateless).
//
// Parses a `superagent` `Error` instance
// into a plain JSON object for storing it in Redux state.
// In case of an `application/json` HTTP response
// the `error` instance ha `.data` JSON object property
// which carries the `application/json` HTTP response data.
//
function defaultParseError(error)
{
	// Copies JSON HTTP response entirely
	const errorData = isObject(error.data) ? error.data : {}

	// Sets HTTP response `status` code
	// if `status` property wasn't present in JSON HTTP response.
	if (!exists(errorData.status)) {
		errorData.status = error.status
	}

	// Copies `message` from `Error` instance
	// if `message` property wasn't present in JSON HTTP response.
	if (!exists(errorData.message)) {
		errorData.message = error.message
	}

	return errorData
}