import useSelectorForPage from './useSelectorForPage.js'

import { PAGE_STATE_REDUCER_NAME_PREFIX } from './constants.js'

import { useIsLeafRoute } from '../router/LeafRouteContext.js'

export default function usePageStateSelector(reducerName, selectorFromReducerState) {
	const isLeafRoute = useIsLeafRoute()
	if (!isLeafRoute) {
		throw new Error('Can only use `usePageStateSelector()` hook inside a "leaf" route component')
	}
	return usePageStateSelectorWithCustomUseSelector(reducerName, selectorFromReducerState, useSelectorForPage)
}

export function usePageStateSelectorWithCustomUseSelector(reducerName, selectorFromReducerState, useSelector) {
	const createFakeState = (state) => {
		const fakeState = {}
		fakeState[reducerName] = state[PAGE_STATE_REDUCER_NAME_PREFIX + reducerName]
		return fakeState
	}
	return useSelector(state => selectorFromReducerState(createFakeState(state)))
}