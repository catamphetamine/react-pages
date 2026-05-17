import type { MetaKeyValuePair } from './normalizeMeta.js'

// import { flatten } from 'lodash-es'
import flatten from 'lodash/flatten.js'

import isObject from '../utility/isObject.js'

// If `value` is an object
// then expand such object
// prefixing property names.
export default function expandObjects(meta: MetaKeyValuePair): MetaKeyValuePair[] {
	if (isObject(meta[1])) {
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