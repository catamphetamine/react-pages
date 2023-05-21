/**
 * Escapes a string so that it's kinda safe to insert into HTML.
 * @return {string}
 */
export default function escapeHtml(string) {
	return string && string
		.replace('&', '&amp;')
		.replace('<', '&lt;')
		.replace('>', '&gt;')
		.replace('"', '&quot;')
		.replace('\'', '&#x27;')
		.replace('/', '&#x2F;')
}