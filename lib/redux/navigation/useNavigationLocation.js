import { useSelector } from 'react-redux'

import { REDUCER_NAME } from '../store.js'

export default function useNavigationLocation() {
	return useSelector(state => state[REDUCER_NAME].navigationLocation)
}