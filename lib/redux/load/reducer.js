import {
	LOAD_STARTED,
	LOAD_FINISHED,
	LOAD_FAILED
} from './actions.js'

// `load` reducer
export default function createPreloadReducer() {
	return function(state = {
		// `loading` is `false` initially because there might be no `.load` functions
		// defined on route `Component`s at all.
		loading: false
	}, action = {}) {
		switch (action.type) {
			case LOAD_STARTED:
				return {
					...state,
					loading: true,
					error: undefined
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
					error: action.error
				}
			default:
				return state
		}
	}
}