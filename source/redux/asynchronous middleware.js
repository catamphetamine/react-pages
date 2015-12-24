// сработает при вызове dispatch({ promise: ... })
export default function middleware(http_client)
{
	return ({ dispatch, getState }) =>
	{
		return next => action =>
		{
			if (typeof action === 'function')
			{
				// or maybe: next(action)
				return action(dispatch, getState)
			}

			const { promise, events, ...rest } = action

			if (!promise)
			{
				return next(action)
			}

			// event names
			const [Request, Success, Failure] = events

			// start asynchronous request
			next({ ...rest, type: Request })

			// returning promise from a middleware is not required.
			// can be used like: store.dispatch({ ... }).then(...)
			return promise(http_client).then
			(
				result => next({ ...rest, result, type: Success }),
				error  => next({ ...rest, error,  type: Failure })
				// error => Promise.reject(next({...rest, error, type: Failure}))
			)
		}
	}
}