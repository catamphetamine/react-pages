// import { ROUTER_DID_CHANGE } from '../redux-router/constants'

// import { locations_are_equal } from '../../location'

// // Implements `react-router`s `onUpdate` handler
// export default function on_route_update_middleware(navigation_performed, history)
// {
// 	return ({ dispatch, getState }) =>
// 	{
// 		return next => action =>
// 		{
// 			// If it isn't a `redux-router` navigation event then do nothing
// 			// if (action.type !== ROUTER_DID_CHANGE)
// 			if (action.type !== '@@react-isomorphic-render/navigated')
// 			{
// 				// Do nothing
// 				return next(action)
// 			}

// 			// // on the server side "getState().router" is
// 			// // either `undefined` (in case of no `@preload()`)
// 			// // or a Promise (in case of `@preload()`)
// 			// const is_server_side = !getState().router
// 			// 	|| (getState().router && typeof getState().router.then === 'function')

// 			// // `onUpdate` is not supposed to be fired on the server side
// 			// // since all navigation is basically HTTP redirection.
// 			// if (is_server_side)
// 			// {
// 			// 	return next(action)
// 			// }

// 			// // When routing is initialized on the client side
// 			// // then ROUTER_DID_CHANGE event will be fired,
// 			// // so ignore this initialization event.
// 			// // if (locations_are_equal(action.payload.location, getState().router.location))
// 			// if (locations_are_equal(action.location, getState().router.location))
// 			// {
// 			// 	// Ignore the event
// 			// 	return next(action)
// 			// }

// 			// Fire `onUpdate` handler
// 			// navigation_performed(action.payload.location)
// 			navigation_performed(action.location)
// 			// Proceed as usual
// 			next(action)
// 		}
// 	}
// }