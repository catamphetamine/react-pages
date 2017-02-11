// uses 'react-document-meta'.
// 'react-helmet' can be used interchangeably.
// import DocumentMeta from 'react-document-meta'
import Helmet from 'react-helmet'
import React, { PropTypes } from 'react'

// Sets webpage title
export function Title({ children })
{
	// // Replaces only webpage title
	// return <DocumentMeta title={ children } extend/>

	return <Helmet title={ children }/>
}

Title.propTypes =
{
	children: PropTypes.string.isRequired
}

// // Sets webpage title, description and meta
// // (resets title, description and meta prior to doing that)
// export function webpage_head({ title, meta })
// {
// 	// // doesn't `extend`, rewrites all these three completely
// 	// return <DocumentMeta title={ title } description={ description } meta={ meta }/>
//
// 	return <Helmet title={ title } meta={ meta }/>
// }

// adds webpage meta tags
export function Meta({ children })
{
	// return <DocumentMeta meta={ children } extend/>

	return <Helmet meta={ children }/>
}

Meta.propTypes =
{
	children: PropTypes.arrayOf(PropTypes.object).isRequired
}

// server-side rendering
export function server_side_generated_webpage_head()
{
	// return DocumentMeta.renderAsReact()

	return Helmet.rewind()
}