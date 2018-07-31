// Helpers

export { Title, Meta } from './es6/webpage head'

// Redux

export
{
	default as preload
}
from './es6/redux/preload'

export
{
	default as onPageLoaded
}
from './es6/redux/on page loaded'

export
{
	default as render,
	getState,
	getHttpClient,
	wasInstantNavigation
}
from './es6/redux/client/client'

export
{
	Preload_started,
	Preload_started as PRELOAD_STARTED,
	Preload_finished,
	Preload_finished as PRELOAD_FINISHED,
	Preload_failed,
	Preload_failed as PRELOAD_FAILED,
	Preload_method_name,
	Preload_method_name as PRELOAD_METHOD_NAME,
	Preload_options_name,
	Preload_options_name as PRELOAD_OPTIONS_NAME
}
from './es6/redux/middleware/preloading middleware'

export
{
	action,
	reset_error,
	reset_error as resetError,
	create_handler,
	create_handler as createHandler,
	state_connector,
	state_connector as stateConnector
}
from './es6/redux/asynchronous action handler'

export
{
	default as reduxModule
}
from './es6/redux/redux module'

export
{
	underscoredToCamelCase,
	event_name,
	event_name as eventName
}
from './es6/redux/naming'

export
{
	goto_action as goto,
	redirect_action as redirect,
	load_state_action as load_state,
	load_state_action as loadState,

	Preload as PRELOAD,
	LoadState,
	LoadState as LOAD_STATE,
	GoTo,
	GoTo as GO_TO,
	Redirect,
	Redirect as REDIRECT,
	Navigated,
	Navigated as NAVIGATED
}
from './es6/redux/actions'

export
{
	default as Link
}
from './es6/redux/Link'

export
{
	default as IndexLink
}
from './es6/redux/IndexLink'

export
{
	default as authorize
}
from './es6/redux/authorize'

export
{
	default as websocket
}
from './es6/redux/client/websocket'

export
{
	get_cookie_in_a_browser as get_cookie,
	get_cookie_in_a_browser as getCookie
}
from './es6/cookies'

export
{
	replace_location,
	replace_location as replaceLocation,
	push_location,
	push_location as pushLocation
}
from './es6/react-router/set location'