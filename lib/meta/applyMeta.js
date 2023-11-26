// import { compact } from 'lodash-es'
import compact from 'lodash/compact.js'

import BrowserDocument from './BrowserDocument.js'
import normalizeMeta from './normalizeMeta.js'
import expandArrays from './expandArrays.js'
import expandObjects from './expandObjects.js'

import escapeHtml from '../escapeHtml.js'
import { setInContext } from '../context.js'

const browserDocument = new BrowserDocument()

/**
 * Updates `<title/>` and `<meta/>` tags (inside `<head/>`).
 */
export default function applyMeta(meta, document = browserDocument) {
	// Tests don't have a `window` global variable.
	if (typeof window !== 'undefined') {
		// `patchMeta()` function uses the latest applied meta snapshot.
		setInContext('App/LatestAppliedMeta', meta)
	}

	const { title, charset } = meta
	meta = normalizeMeta(meta)

	// Get all `<meta/>` tags.
	// (will be mutated)
	const metaTags = document.getMetaTags()

	// Update `<title/>`.
	if (title && document.getTitle() !== title) {
		document.setTitle(title)
	}

	// Update `<meta charset/>`.
	if (charset) {
		updateMetaTag(document, metaTags, 'charset', charset)
	}

	// Update existing `<meta/>` tags.
	// (removing them from `metaTags` array)
	const newMetaTags = compact(
		meta.map(([key, value]) => {
			if (!updateMetaTag(document, metaTags, key, value)) {
				return [key, value]
			}
		})
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
 * @param {Document} document - `BrowserDocument` or `TestDocument`.
 * @return {boolean?}
 */
function updateMetaTag(document, metaTags, name, value) {
	let i = 0
	while (i < metaTags.length) {
		const meta_tag = metaTags[i]
		if (document.isMetaTag(meta_tag, name)) {
			// Update `<meta/>` tag `value`.
			if (document.getMetaTagValue(meta_tag) !== value) {
				document.setMetaTagValue(meta_tag, value)
			}
			// Remove it from `metaTags`.
			metaTags.splice(i, 1)
			// Updated.
			return true
		}
		i++
	}
}