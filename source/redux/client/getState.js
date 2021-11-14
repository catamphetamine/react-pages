// Gets Redux store state before "rehydration".
// In case someone needs to somehow modify
// Redux state before client-side render.
// (because the variable could be potentially renamed in future)
export default function getState(erase) {
	const state = window._redux_state
	if (erase) {
		delete window._redux_state
	}
	return state
}