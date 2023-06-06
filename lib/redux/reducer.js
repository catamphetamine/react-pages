import loadReducer, { getInitialState as getInitialStateForLoadReducer } from './load/reducer.js'

function getInitialState() {
	return {
		...getInitialStateForLoadReducer()
	}
}

export default function reducer(state = getInitialState(), action) {
	state = loadReducer(state, action)
	return state
}