import { useContext } from 'react'

import RouterContext from './RouterContext.js'

// This hook doesn't simply return `state.found.resolvedMatch.location`.
// The reason is that `resolvedMatch` gets updated right after a route
// has been matched against the URL, but there's a small gap in time between
// "the route has been matched" and "the router has rendered the new page".
// That results in the previously rendered page getting an incorrect `location` —
// the location of the next page — while the "old" page is still rendered,
// which caused bugs.
//
// So instead, `<RouterContext/>` React element is rendered, and it always
// gets updated exactly at the time when a new page gets rendered, so at any
// given time it corresponds exactly to what page is actually rendered at the time.
//
export default function useRoute() {
	return useContext(RouterContext).value
}