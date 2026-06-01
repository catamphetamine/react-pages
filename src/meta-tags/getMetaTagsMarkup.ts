import escapeHtml from '../utility/escapeHtml.js'

import { getMetaAttributeFor } from './document/BrowserDocument.js'
import normalizeMeta from './normalizeMeta.js'

import BASE_META from './baseMeta.js'

import type { Meta, MetaAttributeValue } from '../types.d.js'

/**
 * Generates a list of `<title/>` and `<meta/>` tags markup.
 */
export default function getMetaTagsMarkup(meta: Meta): string[] {
	const { title, charset } = meta
	const metaAttributes = normalizeMeta(meta)

	return [
		// `<meta charset/>` should always come first
		// because some browsers only read the first
		// 1024 bytes when deciding on page encoding.
		// (`<meta charset/>` is always present)
		`<meta charset="${escapeHtml(String(charset || BASE_META.charset), { isAttributeValue: true })}"/>`,
		`<title>${escapeHtml(String(title || ''), { isAttributeValue: false })}</title>`
	]
	.concat(
		metaAttributes.map(([key, value]) => generateMetaTagMarkup(key, value))
	)
}

/**
 * Generates `<meta/>` tag HTML markup.
 */
function generateMetaTagMarkup(name: string, value: MetaAttributeValue): string {
	if (typeof value === 'boolean' || typeof value === 'number') {
		value = String(value)
	} else {
		value = escapeHtml(String(value), { isAttributeValue: true })
	}
	return `<meta ${getMetaAttributeFor(name)}="${name}" content="${value}"/>`
}