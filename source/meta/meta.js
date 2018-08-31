import React, { Component } from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'
import flatten from 'lodash/flatten'
import compact from 'lodash/compact'

import BrowserDocument, { getMetaAttributeFor } from './BrowserDocument'
import { getDisplayName } from '../utility'

const browserDocument = new BrowserDocument()

const DEFAULT_META =
{
	viewport : 'width=device-width, initial-scale=1.0'
}

const META_METHOD_NAME = '__meta__'

/**
 * `@meta()` decorator used for adding `<title/>` and <meta/>` tags to a React page.
 * @param  {function} getMeta - A function of `state` returning this page's meta object.
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

		Meta[META_METHOD_NAME] = getMeta
		Meta.displayName = `Meta(${getDisplayName(DecoratedComponent)})`
		return hoistNonReactStatics(Meta, DecoratedComponent)
	}
}

/**
 * Gathers `<title/>` and `<meta/>` tags (inside `<head/>`)
 * defined for this route (`components` array).
 * @return {object}
 */
export function mergeMeta(meta)
{
	// // `Object.assign` is not supported in Internet Explorer.
	// return Object.assign({}, DEFAULT_META, ...)

	meta = meta.reduce((meta, componentMeta) => ({
		...meta,
		...componentMeta
	}),
	DEFAULT_META)

	// Remove `locale` from `locales`.
	if (meta.locale && meta.locales) {
		meta.locales = meta.locales.filter(_ => _ !== meta.locale)
		if (meta.locales.length === 0) {
			delete meta.locales
		}
	}

	return meta
}

/**
 * Gets `React.Component` chain meta.
 * @return {object[]}
 */
export function getComponentsMeta(components, state)
{
	return components
		// `.filter(_ => _)` here just in case someone forgets to set
		// `codeSplit: true` for `<Route/>`s with `getComponent`.
		.filter(_ => _)
		.map(_ => _[META_METHOD_NAME])
		.filter(_ => _)
		.map(_ => _(state))
}

/**
 * Gathers `meta` from routes chain.
 * @return {object[]}
 */
export function getCodeSplitMeta(routes, state) {
	return routes.map(_ => _.meta).filter(_ => _).map(_ => _(state))
}

/**
 * Updates `<title/>` and `<meta/>` tags (inside `<head/>`).
 */
export function updateMeta(meta, document = browserDocument)
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
		updateMetaTag(document, meta_tags, 'charset', charset)
	}

	// Update existing `<meta/>` tags.
	// (removing them from `meta_tags` array)
	const new_meta_tags = compact(flatten(
		Object.keys(meta).map((key) =>
		{
			return [].concat(meta[key])
				.map((value) => {
					if (!updateMetaTag(document, meta_tags, key, value)) {
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
export function generateMetaTagsMarkup(meta)
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
					.map(value => generateMetaTagMarkup(key, value))
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
function generateMetaTagMarkup(name, value)
{
	return `<meta ${getMetaAttributeFor(name)}="${name}" content="${escape_html(value)}"/>`
}

/**
 * Gets `<meta/>` tag "name" by key.
 * "name" can refer to both `name` and `property`.
 * @return {string}
 */
function getMetaTagNames(key)
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
		case 'locales':
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
function updateMetaTag(document, meta_tags, name, value)
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
		for (const name of getMetaTagNames(key)) {
			normalizedMeta[name] = meta[key]
		}
		return normalizedMeta
	}, {})
}