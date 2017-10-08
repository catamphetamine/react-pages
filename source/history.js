import { location_url } from './location'

// Creates `history`
export default function create_history(createHistory, location, history_settings, parameters, server)
{
	const history_options = history_settings.options

	// Create `history`.
	//
	// https://github.com/ReactTraining/react-router/blob/master/docs/guides/Histories.md#customize-your-history-further
	//
	// `entries` is used in `MemoryHistory` only (i.e. on server side)
	// https://github.com/ReactTraining/history/blob/v3.x/modules/createMemoryHistory.js
	//
	let history = createHistory({ ...history_options, entries: [ location ] })

	// For custom `history` wrappers, like `syncHistoryWithStore` from `react-router-redux`.
	if (history_settings.wrap)
	{
		// `parameters` is `{ store }` if Redux is used.
		history = history_settings.wrap(history, parameters)
	}

	// Return `history`
	return history
}

export function get_location(history)
{
	// v4
	if (history.location)
	{
		return history.location
	}

	// v3
	if (history.getCurrentLocation)
	{
		return history.getCurrentLocation()
	}

	// v2
	let location
	const unlisten = history.listen(x => location = x)
	unlisten()
	return location
}
