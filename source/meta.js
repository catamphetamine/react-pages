import React, { Component } from 'react'
import hoist_statics from 'hoist-non-react-statics'

import { get_display_name } from './utility'

export const Meta_method_name = '__meta__'

// `@meta()` decorator used for adding `<title/>` and <meta/>` tags to a page.
//
// Receives `options`:
//
// * `state` — Redux state
//
// Usage:
//
// `@meta(({ state }) => ({ title: `${state.user.name}'s profile` }))`
//
export default function meta(get_meta)
{
	return function(DecoratedComponent)
	{
		class Meta extends Component
		{
			render()
			{
				return <DecoratedComponent {...this.props} />
			}
		}

		Meta[Meta_method_name] = get_meta

		Meta.displayName = `Meta(${get_display_name(DecoratedComponent)})`
		
		return hoist_statics(Meta, DecoratedComponent)
	}
}

const default_meta =
{
	title    : '',
	charset  : 'utf-8',
	viewport : 'width=device-width, initial-scale=1.0, user-scalable=no'
}

// Gathers `<title/>` and `<meta/>` tags (inside `<head/>`)
// defined for this route (`components` array).
export function get_meta(components, location, params, state)
{
	function get_component_meta(component)
	{
		if (component[Meta_method_name])
		{
			return component[Meta_method_name]({ state, location, parameters: params })
		}
	}

	return Object.assign({}, default_meta, ...components.map(get_component_meta))
}

// Updates `<title/>` and `<meta/>` tags (inside `<head/>`)
export function update_meta(meta)
{
	// Update `<title/>`
	if (meta.title && document.title !== meta.title)
	{
		document.title = meta.title
	}

	// Get all `<meta/>` tags
	const meta_tags = Array.prototype.slice.call(document.head.getElementsByTagName('meta'), 0)

	// These will be new `<meta/>` tags
	const new_meta_tags = []

	// Update already existing `<meta/>` tags
	for (const key of Object.keys(meta))
	{
		const name = meta_tag_name(key)

		for (const value of [].concat(meta[key]))
		{
			if (name === 'charset')
			{
				// `<meta charset/>` is always present
				update_meta_tag(meta_tags, undefined, undefined, 'charset', value)
			}
			else if (name.indexOf(':') >= 0)
			{
				update_meta_tag(meta_tags, 'property', name, 'content', value) || new_meta_tags.push([key, value])
			}
			else
			{
				update_meta_tag(meta_tags, 'name', name, 'content', value) || new_meta_tags.push([key, value])
			}
		}
	}

	// Delete no longer existent `<meta/>` tags
	for (const meta_tag of meta_tags)
	{
		meta_tag.parentNode.removeChild(meta_tag)
	}

	// Create new `<meta/>` tags
	for (const [key, value] of new_meta_tags)
	{
		const name = meta_tag_name(key)
		const meta_tag = document.createElement('meta')

		if (name.indexOf(':') >= 0)
		{
			meta_tag.setAttribute('property', name)
		}
		else
		{
			meta_tag.setAttribute('name', name)
		}

		meta_tag.setAttribute('content', value)
		document.head.appendChild(meta_tag)
	}
}

// Generates a list of `<title/>` and `<meta/>` tags markup
export function meta_tags(meta)
{
	const tags = []

	// `<meta charset/>` should always come first
	// because some browsers only read the first
	// 1024 bytes when deciding on page encoding.

	// `<meta charset/>` is always present
	tags.push(`<meta charset="${escape_html(meta.charset)}"/>`)

	tags.push(`<title>${escape_html(meta.title)}</title>`)

	for (const key of Object.keys(meta))
	{
		// `<meta charset/>` has already been added
		if (key === 'charset')
		{
			continue
		}

		const name = meta_tag_name(key)

		for (const value of [].concat(meta[key]).map(escape_html))
		{
			if (name.indexOf(':') >= 0)
			{
				tags.push(`<meta property="${name}" content="${value}"/>`)
			}
			else
			{
				tags.push(`<meta name="${name}" content="${value}"/>`)
			}
		}
	}

	return tags
}

function meta_tag_name(key)
{
	switch (key)
	{
		case 'site_name':
		case 'title':
		case 'description':
		case 'image':
		case 'locale':
		case 'type':
		case 'url':
		case 'audio':
		case 'video':
			return `og:${key}`
		case 'locale_other':
			return 'og:locale:alternate'
		default:
			return key
	}
}

// Updates `<meta/>` tag and removes it from `meta_tags`
function update_meta_tag(meta_tags, key_attribute, key, value_attribute, value)
{
	let i = 0
	while (i < meta_tags.length)
	{
		const meta_tag = meta_tags[i]
		
		if (key_attribute ? meta_tag.getAttribute(key_attribute) === key : meta_tag.getAttribute(value_attribute))
		{
			// Update `<meta/>` tag
			if (meta_tag.getAttribute(value_attribute) !== value)
			{
				meta_tag.setAttribute(value_attribute, value)
			}
			// Remove it from `meta_tags`
			meta_tags.splice(i, 1)
			// Updated
			return true
		}

		i++
	}
}

function escape_html(string)
{
	return string
		.replace('&', '&amp;')
		.replace('<', '&lt;')
		.replace('>', '&gt;')
		.replace('"', '&quot;')
		.replace('\'', '&#x27;')
		.replace('/', '&#x2F;')
}