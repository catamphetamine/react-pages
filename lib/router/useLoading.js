import { useSelector } from 'react-redux'

import { REDUCER_NAME } from '../redux/store.js'

export default function useLoading() {
	return useSelector(state => state[REDUCER_NAME].loading)
}