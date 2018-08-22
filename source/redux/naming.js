// Converts `UNDERSCORED_NAMES` to `camelCasedNames`
export function underscoredToCamelCase(string)
{
	return string.split('_')
		.map((word, i) =>
		{
			let firstLetter = word.slice(0, 1)
			const rest      = word.slice(1)

			if (i === 0)
			{
				firstLetter = firstLetter.toLowerCase()
			}
			else
			{
				firstLetter = firstLetter.toUpperCase()
			}

			return firstLetter + rest.toLowerCase()
		})
		.join('')
}

// Converts `namespace` and `event` into a namespaced event name
export function eventName(namespace, event)
{
	return namespace ? `${namespace}: ${event}` : event
}