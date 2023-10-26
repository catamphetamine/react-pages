import {
	LOAD_STARTED,
	LOAD_FINISHED,
	LOAD_FAILED,
	SET_LOAD_LOCATION
} from './actions.js'

export function getInitialState() {
	return {
		// `loading` is `false` initially because there might be no `.load` functions
		// defined on a page route's `Component`s at all.
		loading: false
	};
}

export default function reducer(state, action) {
	switch (action.type) {
		case LOAD_STARTED:
			return {
				...state,
				loading: true,
				error: undefined,
				navigationLocation: action.location
			}
		case LOAD_FINISHED:
			return {
				...state,
				loading: false
			}
		case LOAD_FAILED:
			return {
				...state,
				loading: false,
				error: action.error,
				navigationLocation: action.previousLocation
			}
		case SET_LOAD_LOCATION:
			return {
				...state,
				navigationLocation: action.location
			}
		default:
			return state
	}
}