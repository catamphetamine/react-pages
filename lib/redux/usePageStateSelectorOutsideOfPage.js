import { useSelector } from 'react-redux'

import { PAGE_STATE_REDUCER_NAME_PREFIX } from './constants.js'

import { useIsNonRootRoute } from '../router/NonRootRouteContext.js'

import { usePageStateSelectorWithCustomUseSelector } from './usePageStateSelector.js'

export default function usePageStateSelectorOutsideOfPage(reducerName, selectorFromReducerState) {
	const isNonRootRoute = useIsNonRootRoute()
	if (isNonRootRoute) {
		throw new Error('Can only use `usePageStateSelectorOutsideOfPage()` hook in a "root" route component and not in its descendant routes\' components')
	}
	return usePageStateSelectorWithCustomUseSelector(reducerName, selectorFromReducerState, useSelector)
}