import type { Meta } from '../types.d.js'

import flatten from '../utility/flatten.js'

import expandArrays from './expandArrays.js'
import expandObjects from './expandObjects.js'

export type MetaKeyValuePair = [string, Meta[keyof Meta]]
type MetaAttributeKeyValuePair = [string, string]

export default function normalizeMeta(meta: Meta): MetaAttributeKeyValuePair[] {
	return flattenMeta(convertMetaObject(meta))
}

/**
 * Transforms meta object having "keys"
 * into a meta object having the actual
 * `<meta/>` tag `name`s and `property`es.
 * @return Array of arrays having shape `[key, value]`.
 */
export function convertMetaObject(meta: Meta): MetaKeyValuePair[] {
	return Object.entries(meta).reduce((all: MetaKeyValuePair[], [key, value]) => {
		for (const alias of getMetaKeyAliases(key)) {
			all.push([alias, value])
		}
		return all
	}, [])
}

/**
 * Gets `<meta/>` property aliases.
 * (for both `name` and `property`).
 * Also filters out `charset`.
 * @return {string}
 */
function getMetaKeyAliases(key: string): string[] {
	switch (key) {
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
		case 'siteName':
			return [`og:site_name`]
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
			return [key]
	}
}

// Expands nested objects.
// Expands arrays.
// param meta — Either an object or an array of arrays having shape `[key, value]`.
// return An array of arrays having shape `[key, value]`.
export function flattenMeta(meta: MetaKeyValuePair[]): MetaAttributeKeyValuePair[] {
	// Convert meta object to an array of arrays having shape `[key, value]`.
	if (!Array.isArray(meta)) {
		meta = Object.entries(meta)
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
