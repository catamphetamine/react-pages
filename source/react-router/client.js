// THIS MODULE IS CURRENTLY NOT USED.
// IT'S JUST HERE AS AN EXAMPLE.

import { render_on_client as render } from './render'
import { exists } from '../helpers'

import client_side_render from '../client/render'
import create_history from '../client/history'
import normalize_common_settings from '../redux/normalize'

// Performs client-side rendering
// along with varios stuff like loading localized messages.
//
// This function is what's gonna be called from the project's code on the client-side.
//
// The following code hasn't been tested.
// Should theoretically work.
// This is not currently being used.
// It's just an example of Redux-less usage.
//
export default function set_up_and_render(settings, options = {})
{
	settings = normalize_common_settings(settings)

	const { translation } = options

	// Create `react-router` `history`
	const history = create_history(document.location, settings.history)

	// Render the page
	return client_side_render
	({
		translation,
		container: common.container,
		render,
		render_parameters:
		{
			history,
			routes: common.routes
		}
	})
}