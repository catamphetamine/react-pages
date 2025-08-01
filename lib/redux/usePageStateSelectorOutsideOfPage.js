import { useSelector } from 'react-redux'

import { useIsRootRoute } from '../router/RootRouteContext.js'

import { usePageStateSelectorWithCustomUseSelector } from './usePageStateSelector.js'

export default function usePageStateSelectorOutsideOfPage(reducerName, selectorFromReducerState) {
	const isRootRoute = useIsRootRoute()
	if (!isRootRoute) {
		throw new Error('Can only use `usePageStateSelectorOutsideOfPage()` hook in a "root" route component and not in its descendant routes\' components')
	}
	return usePageStateSelectorWithCustomUseSelector(reducerName, selectorFromReducerState, useSelector)
}