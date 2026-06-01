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
		// `<title/>` is not a `<meta/>` tag.
		case 'title':
			return []
		// `title` and `description` are not automatically copied to
		// `og:title` and `og:description` because those're actually intended to be different.
    // https://d3creative.uk/blog/title-and-meta-description-vs-open-graph
		// https://indieweb.org/The-Open-Graph-protocol#How_to_set_title
		// https://indieweb.org/The-Open-Graph-protocol#How_to_set_description
		// case 'title':
		// case 'description':
		// 	return [key, `og:${key}`]
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
