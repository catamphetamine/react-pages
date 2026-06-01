/**
 * Escapes a string for including it in XML markup: replaces ">" with "&gt;", etc.
 * https://en.wikipedia.org/wiki/Character_encodings_in_HTML#HTML_character_references
 * @param  {string} string
 * @param  {boolean} options.isAttributeValue — Pass `true` if an XML attribute value is being escaped. Pass `false` otherwise.
 * @return {string}
 */
export default function escapeHtml(string: string, { isAttributeValue }: { isAttributeValue: boolean }) {
	// By default, "&", "<" and ">" characters should be escaped:
	//
	// The ampersand character (&) and the left angle bracket (<) must not appear
	// in their literal form, except when used as markup delimiters, or within a comment,
	// a processing instruction, or a CDATA section. If they are needed elsewhere,
	// they must be escaped using either numeric character references or the strings
	// " & " and " < " respectively. The right angle bracket (>) may be represented
	// using the string " > ", and must, for compatibility, be escaped using either
	// " > " or a character reference when it appears in the string " ]]> " in content,
	// when that string is not marking the end of a CDATA section.
	//
	string = replaceAll(string, '&', '&amp;')
	string = replaceAll(string, '<', '&lt;')
	string = replaceAll(string, '>', '&gt;')

	// Additionally, in attribute values, single and double quotes might be required
	// to be escaped depending on what character is used for delimiting those attribute values.
	if (isAttributeValue) {
		string = replaceAll(string, '\'', '&apos;')
		string = replaceAll(string, '"', '&quot;')
	}

	return string
}

function replaceAll(string: string, replacedSubstring: string, replacementSubstring: string) {
	// `any` here works around TypeScript compiler error:
	// "Property 'replaceAll' does not exist on type 'string'.
	//  Do you need to change your target library?
	//  Try changing the 'lib' compiler option to 'es2021' or later."
	if (typeof (string as any).replaceAll === 'function') {
		return (string as any).replaceAll(replacedSubstring, replacementSubstring)
	}
	// There's no need to escape RegExp special characters in `replacedSubstring`
	// because this function is not exported and is only called internally
	// with a known subset of possible `replacedSubstring`s which are known
	// to not contain any RegExp special characters.
	return string.replace(new RegExp(replacedSubstring, 'g'), replacementSubstring)
}