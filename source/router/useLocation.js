import { useContext } from 'react'

import { LocationContext } from './LocationProvider.js'

export default function useLocation() {
	return useContext(LocationContext)
}