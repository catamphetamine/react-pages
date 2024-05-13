const context = {}

export function getFromContext(key) {
	return context[key]
}

export function takeFromContext(key) {
	const value = getFromContext(key)
	clearInContext(key)
	return value
}

// `value` could be:
// * a simple value like a boolean or an object
// * a function (for example, when adding `onNavigationFinished` listeners)
// * maybe something else.
export function setInContext(key, value) {
	context[key] = value
}

export function clearInContext(key) {
	context[key] = undefined
}

export function clearAllInContextExcept(subkey) {
	for (const key of Object.keys(context)) {
		if (key.indexOf(subkey) !== 0) {
			clearInContext(key)
		}
	}
}