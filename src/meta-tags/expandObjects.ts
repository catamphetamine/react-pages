import type { MetaKeyValuePair } from './normalizeMeta.js'

import flatten from '../utility/flatten.js'
import isObject from '../utility/isObject.js'

// If `value` is an object
// then expand such object
// prefixing property names.
export default function expandObjects(meta: MetaKeyValuePair): MetaKeyValuePair[] {
	if (isObject(meta[1])) {
		return flatten(
			Object.entries(meta[1])
				.map(([key, value]): MetaKeyValuePair => [
					key === '_' ? meta[0] : `${meta[0]}:${key}`,
					value
				])
				// Expand objects recursively.
				.map(expandObjects)
		)
	}
	return [meta]
}