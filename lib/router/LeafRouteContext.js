import { createContext, useContext } from 'react'

const Context = createContext()

export default Context

export function useIsLeafRoute() {
	return useContext(Context)
}