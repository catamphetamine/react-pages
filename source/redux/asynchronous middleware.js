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
			//
			// can be used like: this.props.dispatch(action()).then(...)
			//
			// or most likely as: this.props.bound_action().then(...)
			//
			// or even most likely as:
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
				promise(http_client).then
				(
					result =>
					{
						next({ ...rest, result, type: Success })
						resolve(result)
					},
					error =>
					{
						next({ ...rest, error,  type: Failure })
						reject(error)
					}
				)
			})
		}
	}
}