import escapeHtml from '../escapeHtml.js'

import { getMetaAttributeFor } from './BrowserDocument.js'
import normalizeMeta from './normalizeMeta.js'

import BASE_META from './baseMeta.js'

/**
 * Generates a list of `<title/>` and `<meta/>` tags markup.
 * @param  {object[]} meta
 * @return {string[]}
 */
export default function getMetaTagsMarkup(meta) {
	const { title, charset } = meta
	meta = normalizeMeta(meta)

	return [
		// `<meta charset/>` should always come first
		// because some browsers only read the first
		// 1024 bytes when deciding on page encoding.
		// (`<meta charset/>` is always present)
		`<meta charset="${escapeHtml(charset || BASE_META.charset)}"/>`,
		`<title>${escapeHtml(title || '')}</title>`
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
		value = escapeHtml(String(value))
	}
	return `<meta ${getMetaAttributeFor(name)}="${name}" content="${value}"/>`
}