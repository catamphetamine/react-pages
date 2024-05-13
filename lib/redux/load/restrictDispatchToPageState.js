import { REDUCER_NAME, PAGE_STATE_REDUCER_NAME_PREFIX } from '../constants.js'

// Detects changes to state when `dispatch()`ing actions from a `.load()` function.
// If there were any, those changes must've been done to "page state" parts of the Redux state.
// "Page state" parts of the Redux state should be declared in the settings in `pageStateReducerNames` parameter.
export default function restrictDispatchToPageState(dispatch, { useSelector }) {
	return (action) => {
		// Get "before" and "after" Redux states.
		const stateBefore = useSelector(state => state)
		const prevStateKeys = Object.keys(stateBefore)
		const result = dispatch(action)
		const stateAfter = useSelector(state => state)
		const newStateKeys = Object.keys(stateAfter)

		// Compare the "before" and "after" Redux states.
		for (const key of prevStateKeys) {
			// Every page implicitly modifies the `pages` reducer, so skip it.
			if (key !== REDUCER_NAME) {
				// If a Redux state key has been modified as a result of `dispatch()`ing the action.
				if (stateAfter[key] !== stateBefore[key]) {
					// If the modified Redux state key is not declared as "page state", show an error.
					if (key.indexOf(PAGE_STATE_REDUCER_NAME_PREFIX) !== 0) {
						onReduxStateKeyUpdateNotAllowed(key)
					}
				}
			}
		}

		// Return the result of the original `dispatch()` call.
		return result
	}
}

function onReduxStateKeyUpdateNotAllowed(key) {
	// setTimeout(() => {
		throw new Error(`Page loading function dispatched an action that modified \`${key}\` part of Redux state. Page loading functions are only allowed to modify the parts of Redux state that've specifically been allowed in \`pageStateReducerNames: string[]\` parameter of \`react-pages\` settings. Such parts of Redux state could then be accessed only via \`useSelectorForPageState(reducerName, selectorFromReducerState)\` or \`usePageStateSelectorOutsideOfPage(reducerName, selectorFromReducerState)\``)
	// }, 0)
}
