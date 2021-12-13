import { useContext } from 'react'

import { LocationContext } from './LocationProvider'

export default function useLocation() {
	return useContext(LocationContext)
}