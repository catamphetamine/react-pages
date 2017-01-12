// Strict mode here is required for older browsers like Safari 9
// because of using `const`.
'use strict'

// Helpers

import { webpage_head, webpage_title, webpage_meta } from './es6/webpage head'

export const head  = webpage_head
export const title = webpage_title
export const meta  = webpage_meta

// Redux

import client  from './es6/redux/client/client'
import preload from './es6/redux/preload'

export { client as render, preload }

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
	create_handler,
	create_handler as createHandler,
	state_connector,
	state_connector as stateConnector
}
from './es6/redux/asynchronous action handler'

export
{
	default as asynchronous_action_handler,
	default as asynchronousActionHandler
}
from './es6/redux/asynchronous action handler'

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