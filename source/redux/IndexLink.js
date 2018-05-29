import React from 'react'
import Link from './Link'

// A `<Link>` can know when the route it links to is "active"
// and automatically apply an `activeClassName` and/or `activeStyle`
// when given either prop. The `<Link>` will be "active" if
// the current route is either the linked route or any
// descendant of the linked route. To have the link be "active"
// only on the exact linked route, use `<IndexLink>` instead.
// (citation from `react-router@3` docs)
//
export default function IndexLink(props)
{
	return <Link onlyActiveOnIndex {...props}/>
}