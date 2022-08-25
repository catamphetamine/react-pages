import dropUndefinedProperties from './dropUndefinedProperties.js'

export default function getDefaultMeta(defaultMeta, { getState }) {
	let meta
	if (typeof defaultMeta === 'function') {
		meta = defaultMeta(getState())
	} else {
		meta = defaultMeta
	}
	if (meta) {
		return dropUndefinedProperties(meta)
	}
}