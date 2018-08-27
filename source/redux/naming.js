// Converts `UNDERSCORED_NAMES` to `camelCasedNames`.
// E.g. event `GET_USERS_ERROR` => state.`getUsersError`.
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

export const DEFAULT_REDUX_EVENT_NAMING = (event) =>
([
	`${event}_PENDING`,
	`${event}_SUCCESS`,
	`${event}_ERROR`
])