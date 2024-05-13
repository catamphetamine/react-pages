import { createContext, useContext } from 'react'

import RouterContext from './RouterContext.js'

const Context = createContext()

export default Context

export function useIsNonRootRoute() {
	return useContext(Context)
}

export function useIsRootRoute() {
	const isNonRootRoute = useIsNonRootRoute()
	const routerContextValue = useContext(RouterContext)
	return !isNonRootRoute && Boolean(routerContextValue)
}