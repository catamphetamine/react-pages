import isObject from '../../isObject.js'
import getLocationUrl from '../../getLocationUrl.js'
import { getMatchedLocationThatHasBeenLoaded } from '../../router/index.js'
import { goto } from '../../router/actions.js'
import { DEFAULT_REDUX_EVENT_NAMING } from '../naming.js'

export const RESULT_ACTION_PROPERTY = 'value'
export const ERROR_ACTION_PROPERTY = 'error'

// Asynchronous middleware (e.g. for HTTP Ajax calls).
//
// Takes effect only if the `dispatch`ed action has
// `promise` function and `events` (or `event`) property.
//
// `dispatch()` call will return a `Promise`.
//
export default function asynchronousMiddleware({
	httpClient,
	reduxEventNaming,
	server,
	onError,
	getErrorData = defaultGetErrorData
}) {
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
							[ERROR_ACTION_PROPERTY] : getErrorData(error)
						})

						// The Promise returned from `dispatch()` call
						// is rejected with this error.

						let errorHandlerResult

						// Call `onError()` handler for `http` calls not originating from `.load()` functions
						// because `.load()` function have their own `onLoadError()` handler.
						if (rest.origin !== 'load') {
							if (onError) {
								const location = getMatchedLocationThatHasBeenLoaded(getState())
								// If `onError()` returns `true` then the error won't be printed in the console.
								errorHandlerResult = onError(error, {
									location,
									url: getLocationUrl(location),
									// Using `goto` instead of `redirect` here
									// because it's not part of `load`
									// and is therefore part of some kind of an HTTP request
									// triggered by user input (e.g. form submission)
									// which means it is convenient to be able to
									// go "Back" to the page on which the error originated.
									redirect: to => dispatch(goto(to)),
									dispatch,
									useSelector: getter => getter(getState()),
									server
								})
							}
						}

						// Return the result (error) as `reject(error)`.
						// This is done so that the code could execute a `throw error` statement
						// after this line of code.
						// Throwing an error via `throw error` would result in an
						// "Unhandled rejection" error being thrown which would make the error
						// obvious to the developer.
						reject(error)

						// Throw the error via `throw error`.
						// Throwing an error via `throw error` would result in an
						// "Unhandled rejection" error being thrown which would make the error
						// obvious to the developer.

						// If an error was handled by the developer, don't throw an "Unhandled rejection" error.
						// Also don't throw any errors on server side so that the server process doesn't terminate.
						if (errorHandlerResult !== true && !server) {
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
function defaultGetErrorData(error)
{
	// Copies JSON HTTP response entirely
	const errorData = isObject(error.data) ? error.data : {}

	// Sets HTTP response `status` code
	// if `status` property wasn't present in JSON HTTP response.
	if (errorData.status === undefined) {
		errorData.status = error.status
	}

	// Copies `message` from `Error` instance
	// if `message` property wasn't present in JSON HTTP response.
	if (!errorData.message) {
		errorData.message = error.message
	}

	return errorData
}