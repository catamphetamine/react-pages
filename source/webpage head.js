// uses 'react-document-meta'.
// 'react-helmet' can be used interchangeably.
import DocumentMeta from 'react-document-meta'

// fixes strange bug: "ReferenceError: React is not defined"
import React from 'react'

// sets webpage title
export function webpage_title(title)
{
	// replaces only webpage title
	return <DocumentMeta title={title} extend/>
}

// sets webpage title, description and meta
// (resets title, description and meta prior to doing that)
export function webpage_head(title, description, meta)
{
	// doesn't `extend`, rewrites all these three completely
	return <DocumentMeta title={title} description={description} meta={meta}/>
}

// adds webpage meta tags
export function webpage_meta(meta)
{
	return <DocumentMeta meta={meta} extend/>
}

// server-side rendering
export function server_generated_webpage_head()
{
	return DocumentMeta.renderAsReact()
}