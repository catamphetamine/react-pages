// https://github.com/ReactTraining/react-router/issues/4023
// Also adds `useBasename` and `useQueries`
import createHistory from 'react-router/lib/createMemoryHistory'

import _create_history from '../history'
import redirect from '../server redirect'

export default function create_history(relative_url, history_settings, parameters)
{
	// Create `history` (`true` indicates server-side usage).
	const history = _create_history(createHistory, relative_url, history_settings, parameters, true)

	// Because History API won't work on the server side for navigation,
	// instrument it with custom redirection handlers.
	history.replace = redirect
	history.push    = redirect

	return history
}