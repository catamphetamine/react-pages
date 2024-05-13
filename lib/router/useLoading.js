import { useSelector } from 'react-redux'

import { REDUCER_NAME } from '../redux/constants.js'

export default function useLoading() {
	return useSelector(state => state[REDUCER_NAME].loading)
}