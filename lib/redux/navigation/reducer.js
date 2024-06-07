import { SET_NAVIGATION_LOCATION } from './actions.js'
import getNavigationLocation from './getNavigationLocation.js'

export default function reducer(state, action) {
	switch (action.type) {
		case SET_NAVIGATION_LOCATION:
			return {
				...state,
				navigationLocation: action.location
			}
		default:
			return state
	}
}