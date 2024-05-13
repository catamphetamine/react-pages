import { useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import useNavigationLocation from './navigation/useNavigationLocation.js'

import useLocation from '../router/useLocation.js'

// See the `README.md` section on `useSelectorForLocation()` for more details.
// In summary, it is a "safe" replacement for `useSelector()` hook
// that should be used to access page-specific data in Redux state.
// It guards against the situations when the user navigates from same page component
// to same page component, resulting in the page-specific state being corrupted
// during the transition period.
export default function useSelectorForLocation(selector) {
	// This is a fully-formed location object:
	// {
	//   "action": "POP",
	//   "origin": "http://localhost:1234",
	//   "protocol": "http:",
	//   "host": "localhost:1234",
	//   "hostname": "localhost",
	//   "port": "1234",
	//   "pathname": "/a",
	//   "search": "",
	//   "hash": "",
	//   "key": "wcyrb4:0",
	//   "index": 1,
	//   "delta": 0,
	//   "query": {}
	// }
	const location = useLocation()

	// This is an object of a very simplistic shape:
	// { pathname: '/a', search: '', hash: '' }
	// I.e. it doesn't have any propeties of a `normal` location:
	// `action: "POP"`, `key: "wcyrb4:0"`, etc.
	const navigationLocation = useNavigationLocation()

	const value = useSelector(selector)

	const latestValueForThisLocation = useRef()
	if (location.pathname === navigationLocation.pathname) {
		latestValueForThisLocation.current = value
	}

	return latestValueForThisLocation.current
}