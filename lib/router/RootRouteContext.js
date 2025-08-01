import { createContext, useContext } from 'react'

const Context = createContext()

export default Context

export function useIsRootRoute() {
	return useContext(Context)
}

// import RouterContext from './RouterContext.js'
//
// export function useIsRootRoute() {
// 	const isRootRoute = useIsRootRoute()
// 	const routerContextValue = useContext(RouterContext)
// 	return !isRootRoute && Boolean(routerContextValue)
// }