import BrowserDocument from './document/BrowserDocument.js'
import normalizeMeta from './normalizeMeta.js'

import type { Document } from './document/Document.d.js'

import type { Meta } from '../types.d.js'

const browserDocument = new BrowserDocument()

/**
 * Updates `<meta/>` tags (inside `<head/>`).
 */
export default function applyMeta(meta: Meta, document: Document = browserDocument) {
	const { charset } = meta
	const metaAttributes = normalizeMeta(meta)

	// Get all `<meta/>` tags.
	// (will be mutated)
	const metaTags = document.getMetaTags()

	// Update `<meta charset/>`.
	if (charset) {
		updateMetaTag(document, metaTags, 'charset', String(charset))
	}

	// Update existing `<meta/>` tags.
	// (removing them from `metaTags` array)
	const newMetaTags =
		metaAttributes.map(([key, value]) => {
			if (!updateMetaTag(document, metaTags, key, value)) {
				return [key, value]
			}
		}).filter(
			(metaTag): metaTag is string[] => Boolean(metaTag)
		)

	// Delete no longer existent `<meta/>` tags.
	metaTags.forEach(document.removeMetaTag)

	// Create new `<meta/>` tags.
	for (const [key, value] of newMetaTags) {
		document.addMetaTag(key, value)
	}
}

/**
 * Updates `<meta/>` tag to a new `value` and removes it from `metaTags`.
 */
function updateMetaTag<MetaTag>(
	document: Document<MetaTag>,
	metaTags: MetaTag[],
	name: string,
	value: string
) {
	let i = 0
	while (i < metaTags.length) {
		const metaTag = metaTags[i]
		if (document.isMetaTag(metaTag, name)) {
			// Update `<meta/>` tag `value`.
			if (document.getMetaTagValue(metaTag) !== value) {
				document.setMetaTagValue(metaTag, value)
			}
			// Remove it from `metaTags`.
			metaTags.splice(i, 1)
			// Updated.
			return true
		}
		i++
	}
}