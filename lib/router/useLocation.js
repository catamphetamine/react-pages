import { useContext } from 'react'

import RouterContext from './RouterContext.js'

// This hook doesn't simply return `state.found.resolvedMatch.location`.
// The reason is that `resolvedMatch` gets updated right after a route
// has been matched against the URL (and `load`ed), but there's a small gap in time
// between "the route has been matched and loaded" and "the router has rendered the new page".
// In other words, when the "current location" gets updated in router state,
// the previous page is still rendered because React will re-render the whole tree
// "asynchronously" some (indeterminate) time after the state has been updated.
// This resulted in the previously rendered page getting an incorrect `location`
// for a brief period of time — the location of the next page — which caused bugs.
//
// To work around that, this `useLocation()` hook has been created which always returns
// the "currently rendered location" rather than just "current location" as per router state.
//
// Somewhere up the tree, `<RouterContext.Provider/>` React element is rendered,
// and the context `value` that is "provided" by it gets updated exactly at the time
// when a new page gets rendered (i.e. inside the render function), meaning that
// at any given time the context `value` is accessed during a React render,
// it corresponds exactly to the `location` of the page that is currently rendered on screen.
//
export default function useLocation() {
	return useContext(RouterContext).value.location
}