import { match } from 'react-router'

// Matches a `location` (or a `url`) agains the `routes`
// (to a hierarchy of React-router `<Route/>`s).
//
// If no `location` is passed but `history` was passed
// then `location` is taken from the `history`'s current location.
//
// If no `history` is passed then an in-memory history is created.
// (server side usage)
//
// Returns a Promise resolving to an object:
//
//   redirect    - in case of an HTTP redirect
//
//   router_state - the "next Router state":
//
//       components - matched hierarchy of React-router `<Route/>`s
//       location   - ...
//       params     - ...
//
export default function match_routes_against_location({ routes, location, history })
{
	// (not using `promisify()` helper here 
	//  to avoid introducing dependency on `bluebird` Promise library)
	//
	return new Promise((resolve, reject) =>
	{
		// Perform routing for this `location`
		match({ routes, location, history }, (error, redirect_location, router_state) =>
		{
			// If routing process failed
			if (error)
			{
				return reject(error)
			}

			// If a decision to perform a redirect was made 
			// during the routing process,
			// then redirect to another url
			if (redirect_location)
			{
				return resolve
				({
					redirect: redirect_location
				})
			}

			// In case some weird stuff happened
			if (!router_state)
			{
				return reject(new Error('No router state'))
			}

			return resolve({ router_state })
		})
	})
}