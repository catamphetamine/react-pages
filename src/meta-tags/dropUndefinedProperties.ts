import isObject from '../utility/isObject.js'

export default function dropUndefinedProperties(object: object) {
	for (const value of Object.values(object)) {
		if (value === undefined) {
			return Object.entries(object).reduce((newObject: any, [key, value]) => {
				if (value !== undefined) {
					newObject[key] = value
				}
				return newObject
			},
			{})
		} else if (isObject(value)) {
			// Proceed recursively.
			dropUndefinedProperties(value)
		}
	}
	return object
}