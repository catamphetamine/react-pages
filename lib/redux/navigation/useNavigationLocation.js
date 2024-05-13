import { useSelector } from 'react-redux'

import { REDUCER_NAME } from '../constants.js'

// Returns the "current location" as per the state of the router.
// This doesn't necessarily correspond to the "currently rendered page"
// due to the inherent lag between updating router state and
// re-rendering the router React element (rendering the new page).
export default function useNavigationLocation() {
	// Returns an object of a very simplistic shape:
	// { pathname: '/a', search: '', hash: '' }
	// I.e. it doesn't have any propeties of a `normal` location:
	// `action: "POP"`, `key: "wcyrb4:0"`, etc.
	return useSelector(state => state[REDUCER_NAME].navigationLocation)
}