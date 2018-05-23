import { store_in_history, get_from_history } from './history store'

export function add_instant_back(next_location, previous_location)
{
	let instant_back = get_from_history('instant-back', '')

	if (instant_back)
	{
		let previous_location_index = instant_back.indexOf(get_location_key(previous_location))

		if (previous_location_index < 0)
		{
			// console.error('[react-isomorphic-render] Error: previous location not found in an already existing instant back navigation chain', get_location_key(previous_location), instant_back)
			// Anomaly detected.
			// Reset the chain.
			instant_back = [get_location_key(previous_location)]
			previous_location_index = 0
		}

		instant_back = instant_back.slice(0, previous_location_index + 1)
	}
	else
	{
		instant_back = [get_location_key(previous_location)]
	}

	instant_back.push(get_location_key(next_location))

	store_in_history('instant-back', '', instant_back)
}

export function is_instant_transition(from_location, to_location)
{
	const instant_back = get_from_history('instant-back', '') || []

	return instant_back.indexOf(get_location_key(from_location)) >= 0 &&
		instant_back.indexOf(get_location_key(to_location)) >= 0
}

export function reset_instant_back()
{
	store_in_history('instant-back', '', undefined)
}

// The initial `location` (page) has no `key`
function get_location_key(location)
{
	return location.key ? location.key : 'initial'
}