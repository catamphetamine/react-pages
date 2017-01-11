export default function history_middleware(history)
{
	return ({ getState, dispatch }) =>
	{
		return next => action =>
		{
			if (action.type === '@@react-isomorphic-render/redirect')
			{
				dispatch({ type: '@@react-isomorphic-render/navigated', location: action.location })
				return history.replace(action.location)
			}

			if (action.type === '@@react-isomorphic-render/goto')
			{
				dispatch({ type: '@@react-isomorphic-render/navigated', location: action.location })
				return history.push(action.location)
			}

			return next(action)
		}
	}
}