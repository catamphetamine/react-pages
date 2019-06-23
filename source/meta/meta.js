import React, { Component } from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'
import flatten from 'lodash/flatten'
import compact from 'lodash/compact'

import BrowserDocument, { getMetaAttributeFor } from './BrowserDocument'
import { getDisplayName } from '../utility'

const browserDocument = new BrowserDocument()

const DEFAULT_META =
{
	charset  : 'utf-8',
	// Fixes CSS screen width on mobile devices.
	// Otherwise media queries would not be applied initially
	// and it would show desktop version design.
	// Also, for `/react-website-blank` page this meta tag
	// needs to be present in markup as the default one
	// because `/react-website-blank` page doesn't collect
	// meta from page components.
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
 * @param {object[]} meta — An array of meta objects.
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
	{ ...DEFAULT_META })

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
		.map(_ => dropUndefinedProperties(_(state)))
}

/**
 * Gathers `meta` from `<Route/>`s chain.
 * Meta could have been provided via the standard `@meta()` decorator instead
 * but `found` router doesn't provide the actual React Components for `<Route/>`s
 * which are resolved through `getComponent` so there's currently no way
 * of getting the actual Route component classes, hence the `meta` property workaround.
 *
 * @return {object[]}
 */
export function getCodeSplitMeta(routes, state) {
	return routes
		.map(_ => _.meta)
		.filter(_ => _)
		.map(_ => dropUndefinedProperties(_(state)))
}

/**
 * Updates `<title/>` and `<meta/>` tags (inside `<head/>`).
 */
export function updateMeta(meta, document = browserDocument)
{
	const { title, charset } = meta
	meta = normalizeMeta(meta)

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
	const new_meta_tags = compact(
		meta.map(([key, value]) => {
			if (!updateMetaTag(document, meta_tags, key, value)) {
				return [key, value]
			}
		})
	)

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
	meta = normalizeMeta(meta)

	return [
		// `<meta charset/>` should always come first
		// because some browsers only read the first
		// 1024 bytes when deciding on page encoding.
		// (`<meta charset/>` is always present)
		`<meta charset="${escapeHTML(charset || DEFAULT_META.charset)}"/>`,
		`<title>${escapeHTML(title || '')}</title>`
	]
	.concat(
		meta.map(([key, value]) => generateMetaTagMarkup(key, value))
	)
}

/**
 * Generates `<meta/>` tag HTML markup.
 * @param {string} key
 * @param {string} value
 * @return {string}
 */
function generateMetaTagMarkup(name, value) {
	if (typeof value === 'boolean' || typeof value === 'number') {
		value = String(value)
	} else {
		value = escapeHTML(String(value))
	}
	return `<meta ${getMetaAttributeFor(name)}="${name}" content="${value}"/>`
}

/**
 * Gets `<meta/>` property aliases.
 * (for both `name` and `property`).
 * Also filters out `charset`.
 * @return {string}
 */
function getMetaKeyAliases(key)
{
	switch (key)
	{
		// `<meta charset/>` is handled specially
		// because it doesn't have `name` attribute.
		case 'charset':
			return []
		// `<meta name="description"/>` is an older and
		// more widely supported form than "og:description".
		// In practice there's no need to duplicate
		// `<meta name="description"/>` as "og:description".
		// Still, to keep it fully-OpenGraph-compliant
		// the description is duplicated as "og:description" here.
		// https://indieweb.org/The-Open-Graph-protocol#How_to_set_description
		case 'description':
			return [key, `og:${key}`]
		case 'site_name':
		// `title` property of `meta` object is
		// handled specially via a `<title/>` tag.
		// There would be no need to add `og:title`
		// which duplicates the existing `<title/>`,
		// and `title` property could be discarded here.
		// For example, Facebook falls back to `<title/>` tag.
		// Still, OpenGraph specs formally require an `og:title`.
		// So, to keep it fully-OpenGraph-compliant
		// the title is duplicated as "og:title" here.
		// https://indieweb.org/The-Open-Graph-protocol#How_to_set_title
		case 'title':
		// SVG images are not supported (boo).
		// https://indieweb.org/The-Open-Graph-protocol#How_to_set_image
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
			return [escapeHTML(key)]
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
function escapeHTML(string)
{
	return string && string
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
 * @return Array of arrays having shape `[key, value]`.
 */
function normalizeMetaKeys(meta)
{
	return Object.keys(meta).reduce((all, key) => {
		for (const alias of getMetaKeyAliases(key)) {
			all.push([alias, meta[key]])
		}
		return all
	}, [])
}

function normalizeMeta(meta) {
	return convertMeta(normalizeMetaKeys(meta))
}

function dropUndefinedProperties(object)
{
	const keys = Object.keys(object)
	for (const key of keys) {
		if (object[key] === undefined) {
			return keys.reduce((newObject, key) => {
				if (object[key] !== undefined) {
					newObject[key] = object[key]
				}
				return newObject
			},
			{})
		}
	}
	return object
}

// Expands nested objects.
// Expands arrays.
// @param meta — Either an object or an array of arrays having shape `[key, value]`.
// @return An array of arrays having shape `[key, value]`.
export function convertMeta(meta) {
	// Convert meta object to an array of arrays having shape `[key, value]`.
	if (!Array.isArray(meta)) {
		meta = Object.keys(meta).map(key => [key, meta[key]])
	}
	return flatten(
		meta.map((keyValue) => {
			return flatten(
				expandArrays(keyValue)
					.map(expandObjects)
			)
		})
	)
}

// There can be arrays of properties.
// For example:
// <meta property="og:image" content="//example.com/image.jpg" />
// <meta property="og:image:width" content="100" />
// <meta property="og:image:height" content="100" />
// <meta property="og:image" content="//example.com/image@2x.jpg" />
// <meta property="og:image:width" content="200" />
// <meta property="og:image:height" content="200" />
export function expandArrays(meta) {
	if (Array.isArray(meta[1])) {
		return meta[1].map(value => [meta[0], value])
	}
	return [meta]
}

// If `value` is an object
// then expand such object
// prefixing property names.
export function expandObjects(meta) {
	if (typeof meta[1] === 'object') {
		return flatten(
			Object.keys(meta[1])
				.map((key) => [
					key === '_' ? meta[0] : `${meta[0]}:${key}`,
					meta[1][key]
				])
				// Expand objects recursively.
				.map(expandObjects)
		)
	}
	return [meta]
}

export function convertOpenGraphLocaleToLanguageTag(ogLocale) {
	return ogLocale.replace('_', '-')
}