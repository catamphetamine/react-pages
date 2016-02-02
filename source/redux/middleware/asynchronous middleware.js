// enables support for Ajax Http requests
//
// takes effect if the `dispatch`ed message has 
// { promise: ... }
//
// in all the other cases it will do nothing

export default function middleware(http_client)
{
	return ({ dispatch, getState }) =>
	{
		return next => action =>
		{
			// if (typeof action === 'function')
			// {
			// 	// or maybe: next(action)
			// 	return action(dispatch, getState)
			// }

			const { promise, events, ...rest } = action

			// if the dispatched message doesn't have a `promise` field
			// then do nothing
			if (!promise)
			{
				// move further the Redux middleware chain
				return next(action)
			}

			// event names
			const [Request, Success, Failure] = events

			// dispatch the `pending` event to the Redux store
			next({ ...rest, type: Request })

			// returning promise from a middleware is not required.
			//
			// can be used like: this.props.dispatch(action()).then(...)
			// if it's the first middleware in the middleware chain
			// (which it is)
			//
			// also can be written as: this.props.bound_action().then(...)
			//
			// or as:
			//
			// async do_something()
			// {
			// 	try
			// 	{
			// 		const result = await this.props.bound_action({ ... })
			// 	}
			// 	catch (error)
			// 	{
			// 		alert(error.status)
			// 	}
			// }
			//
			return new Promise((resolve, reject) =>
			{
				// perform Http request
				promise(http_client).then
				(
					// if the Http request succeeded
					//
					// (Http status === 20x
					//  and the Http response JSON object doesn't have an `error` field)
					result =>
					{
						// dispatch the `success` event to the Redux store
						next({ ...rest, result, type: Success })

						// the Promise returned from `dispatch()` is resolved
						resolve(result)
					},
					// if the Http request failed
					//
					// (Http status !== 20x
					//  or the Http response JSON object has an `error` field)
					error =>
					{
						// dispatch the `failure` event to the Redux store
						next({ ...rest, error,  type: Failure })

						// the Promise returned from `dispatch()` is rejected
						reject(error)
					}
				)
			})
		}
	}
}