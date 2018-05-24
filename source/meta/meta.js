import React, { Component } from 'react'
import hoist_statics from 'hoist-non-react-statics'
import flatten from 'lodash/flatten'
import compact from 'lodash/compact'

import BrowserDocument, { meta_attribute_for } from './BrowserDocument'
import { get_display_name } from '../utility'

const browser_document = new BrowserDocument()

const default_meta =
{
	viewport : 'width=device-width, initial-scale=1.0'
}

export const Meta_method_name = '__meta__'

/**
 * `@meta()` decorator used for adding `<title/>` and <meta/>` tags to a React page.
 * @param  {function} getMeta - A function of `{ state, location, parameters }` returning this page's meta object.
 * @example
 * @meta(({ state }) => ({ title: `${state.user.name}'s profile` }))
 */
export default function meta(getMeta)
{
	return function(DecoratedComponent)
	{
		class Meta extends Component {
			render() {
				return <DecoratedComponent {...this.props} />
			}
		}

		Meta[Meta_method_name] = getMeta
		Meta.displayName = `Meta(${get_display_name(DecoratedComponent)})`
		return hoist_statics(Meta, DecoratedComponent)
	}
}

/**
 * Gathers `<title/>` and `<meta/>` tags (inside `<head/>`)
 * defined for this route (`components` array).
 * @return {object}
 */
export function get_meta(components, location, params, state)
{
	// // `Object.assign` is not supported in Internet Explorer.
	// return Object.assign({}, default_meta, ...components.map(_ => get_component_meta(_, ...))))

	return components.reduce((meta, component) => ({
		...meta,
		...get_component_meta(component, state, location, params)
	}),
	default_meta)
}

/**
 * Gets `React.Component`'s meta.
 * @return {object?}
 */
function get_component_meta(component, state, location, parameters)
{
	if (component[Meta_method_name])
	{
		return component[Meta_method_name]
		({
			state,
			location,
			parameters
		})
	}
}

/**
 * Updates `<title/>` and `<meta/>` tags (inside `<head/>`).
 */
export function update_meta(meta, document = browser_document)
{
	const { title, charset } = meta
	meta = normalizeMetaKeys(meta)

	// Get all `<meta/>` tags.
	// (will be mutated)
	const meta_tags = document.getMetaTags()

	// Update `<title/>`.
	if (title && document.getTitle() !== title) {
		document.setTitle(title)
	}

	// Update `<meta charset/>`.
	if (charset) {
		update_meta_tag(document, meta_tags, 'charset', charset)
	}

	// Update existing `<meta/>` tags.
	// (removing them from `meta_tags` array)
	const new_meta_tags = compact(flatten(
		Object.keys(meta).map((key) =>
		{
			return [].concat(meta[key])
				.map((value) => {
					if (!update_meta_tag(document, meta_tags, key, value)) {
						return [key, value]
					}
				})
		})
	))

	// Delete no longer existent `<meta/>` tags.
	meta_tags.forEach(document.removeMetaTag)

	// Create new `<meta/>` tags.
	for (const [key, value] of new_meta_tags) {
		document.addMetaTag(key, value)
	}
}

/**
 * Generates a list of `<title/>` and `<meta/>` tags markup.
 * @param  {object[]} meta
 * @return {string[]}
 */
export function generate_meta_tags_markup(meta)
{
	const { title, charset } = meta
	meta = normalizeMetaKeys(meta)

	return [
		// `<meta charset/>` should always come first
		// because some browsers only read the first
		// 1024 bytes when deciding on page encoding.
		// (`<meta charset/>` is always present)
		`<meta charset="${escape_html(charset || 'utf-8')}"/>`,
		`<title>${escape_html(title || '')}</title>`
	]
	.concat
	(
		flatten
		(
			Object.keys(meta).map((key) =>
			{
				// Convert meta value to an array.
				return [].concat(meta[key])
					.map(value => meta_tag_markup(key, value))
			})
		)
	)
}

/**
 * Generates `<meta/>` tag HTML markup.
 * @param {string} key
 * @param {string} value
 * @return {string}
 */
function meta_tag_markup(name, value)
{
	return `<meta ${meta_attribute_for(name)}="${name}" content="${escape_html(value)}"/>`
}

/**
 * Gets `<meta/>` tag "name" by key.
 * "name" can refer to both `name` and `property`.
 * @return {string}
 */
function meta_tag_names(key)
{
	switch (key)
	{
		// `<meta charset/>` is handled specially
		// because it doesn't have `name` attribute.
		case 'charset':
			return []
		case 'description':
			return [key, `og:${key}`]
		case 'site_name':
		case 'title':
		case 'image':
		case 'locale':
		case 'type':
		case 'url':
		case 'audio':
		case 'video':
			return [`og:${key}`]
		case 'locale_other':
			return ['og:locale:alternate']
		default:
			return [escape_html(key)]
	}
}

/**
 * Updates `<meta/>` tag to a new `value` and removes it from `meta_tags`.
 * @param {Document} document - `BrowserDocument` or `TestDocument`.
 * @return {boolean?}
 */
function update_meta_tag(document, meta_tags, name, value)
{
	let i = 0
	while (i < meta_tags.length)
	{
		const meta_tag = meta_tags[i]

		if (document.isMetaTag(meta_tag, name))
		{
			// Update `<meta/>` tag `value`.
			if (document.getMetaTagValue(meta_tag) !== value) {
				document.setMetaTagValue(meta_tag, value)
			}
			// Remove it from `meta_tags`.
			meta_tags.splice(i, 1)
			// Updated.
			return true
		}

		i++
	}
}

/**
 * Escapes a string so that it's kinda safe to insert into HTML.
 * @return {string}
 */
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

/**
 * Transforms meta object having "keys"
 * into a meta object having the actual
 * `<meta/>` tag `name`s and `property`es.
 * @return {object}
 */
function normalizeMetaKeys(meta)
{
	return Object.keys(meta).reduce((normalizedMeta, key) => {
		for (const name of meta_tag_names(key)) {
			normalizedMeta[name] = meta[key]
		}
		return normalizedMeta
	}, {})
}