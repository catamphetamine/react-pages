import loadReducer, { getInitialState as getInitialStateForLoadReducer } from './load/reducer.js'
import navigationReducer from './navigation/reducer.js'

function getInitialState() {
	return {
		...getInitialStateForLoadReducer()
	}
}

export default function reducer(state = getInitialState(), action) {
	state = loadReducer(state, action)
	state = navigationReducer(state, action)
	return state
}