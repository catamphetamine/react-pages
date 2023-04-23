import {
	PRELOAD_STARTED,
	PRELOAD_FINISHED,
	PRELOAD_FAILED
} from './actions.js'

// `load` reducer
export default function createPreloadReducer() {
	return function(state = {
		initial: true,
		pending: true,
		// immediate: true
		immediate: false
	}, action = {}) {
		switch (action.type) {
			case PRELOAD_STARTED:
				return {
					...state,
					pending: true,
					immediate: action.immediate || false,
					error: undefined
				}
			case PRELOAD_FINISHED:
				return {
					...state,
					pending: false,
					immediate: false,
					initial: false
				}
			case PRELOAD_FAILED:
				return {
					...state,
					pending: false,
					immediate: false,
					initial: false,
					error: action.error
				}
			default:
				return state
		}
	}
}