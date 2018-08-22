import { isObject } from './helpers'

// ISO 8601 date regular expression
// Adapted from: http://stackoverflow.com/a/14322189/970769

const hours = '([01]\\d|2[0-3])'
const minutes = '[0-5]\\d'
const midnight_weird = '24\\:00'
const seconds = '[0-5]\\d'
const milliseconds = '\\d+'
const time = `(${hours}\\:${minutes}|${midnight_weird})\\:${seconds}([\\.,]${milliseconds})?`

const timezone_hours = `([01]\\d|2[0-3])`
const timezone_minutes = `[0-5]\\d`
const timezone = `([zZ]|([\\+-])${timezone_hours}\\:?(${timezone_minutes})?)`

const year = '\\d{4}'
const month = '(0[1-9]|1[0-2])'
const day = '([12]\\d|0[1-9]|3[01])'

export const ISO_date_regexp = `${year}-${month}-${day}T${time}${timezone}`
export const ISO_date_matcher = new RegExp('^' + ISO_date_regexp + '$')

// JSON date deserializer.
//
// Automatically converts ISO serialized `Date`s
// in JSON responses for Ajax HTTP requests.
//
// Without it the developer would have to convert
// `Date` strings to `Date`s in Ajax HTTP responses manually.
//
// Use as the second, 'reviver' argument to `JSON.parse`: `JSON.parse(json, JSON.dateParser)`
//
// http://stackoverflow.com/questions/14488745/javascript-json-date-deserialization/23691273#23691273

// Walks JSON object tree
export default function parseDates(object)
{
	// If it's a date in an ISO string format, then parse it
	if (typeof object === 'string' && ISO_date_matcher.test(object))
	{
		return new Date(object)
	}
	// If an array is encountered,
	// proceed recursively with each element of this array.
	else if (object instanceof Array)
	{
		let i = 0
		while (i < object.length)
		{
			object[i] = parseDates(object[i])
			i++
		}
	}
	// If a child JSON object is encountered,
	// convert all of its `Date` string values to `Date`s,
	// and proceed recursively for all of its properties.
	else if (isObject(object))
	{
		for (const key of Object.keys(object))
		{
			// proceed recursively
			object[key] = parseDates(object[key])
		}
	}

	// Dates have been converted for this JSON object
	return object
}