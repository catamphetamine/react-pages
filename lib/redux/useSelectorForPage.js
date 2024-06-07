import { useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import useNavigationLocation from './navigation/useNavigationLocation.js'

import useLocation from '../router/useLocation.js'
import isSamePage from '../isSamePage.js'

// `useSelectorForPage()` is a "safe" replacement for `useSelector()` hook
// that should be used to access page-specific data in Redux state.
// It guards against the situations when the user navigates from same page component
// to same page component, resulting in the page-specific state being corrupted
// during the transition period.
//
// The concept of a "page" is: a "page" is something within a certain pathname.
// I.e. changing URL query parameters or "hash" isn't considered "going to another page",
// even though the URL value in the address bar changes in those cases.
// Only changing URL query `pathname` is considered "going to another page".
//
// See the comments in `isSamePage.js` file for the rationale on defining a "page" that way.
//
export default function useSelectorForPage(selector) {
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

	// `navigationLocation` object has the same shape as the `location` object above.
	const navigationLocation = useNavigationLocation()

	const value = useSelector(selector)

	const latestValueForThisLocation = useRef()
	if (isSamePage(location, navigationLocation)) {
		latestValueForThisLocation.current = value
	}

	return latestValueForThisLocation.current
}