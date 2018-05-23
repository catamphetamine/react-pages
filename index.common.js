// Helpers

exports.meta  = require('./cjs/meta/meta').default

// Redux

var preload_actions   = require('./cjs/redux/preload/actions')

exports.Preload_started      = preload_actions.Preload_started
exports.PRELOAD_STARTED      = exports.Preload_started
exports.Preload_finished     = preload_actions.Preload_finished
exports.PRELOAD_FINISHED     = exports.Preload_finished
exports.Preload_failed       = preload_actions.Preload_failed
exports.PRELOAD_FAILED       = exports.Preload_failed

var preload_decorator = require('./cjs/redux/preload/decorator')

exports.preload       = preload_decorator.default
exports.loading       = preload_actions.indicate_loading
exports.onPageLoaded  = require('./cjs/redux/preload/onPageLoaded').default

exports.Loading       = require('./cjs/components/Loading').default

exports.render               = require('./cjs/redux/client/client').default
exports.getState             = require('./cjs/redux/client/client').getState
exports.getHttpClient        = require('./cjs/redux/client/client').getHttpClient
exports.wasInstantNavigation = require('./cjs/redux/client/client').wasInstantNavigation

exports.Preload_method_name  = preload_decorator.Preload_method_name
exports.PRELOAD_METHOD_NAME  = exports.Preload_method_name
exports.Preload_options_name = preload_decorator.Preload_options_name
exports.PRELOAD_OPTIONS_NAME = exports.Preload_options_name

exports.redux_module = require('./cjs/redux/redux module').default
exports.reduxModule  = exports.redux_module

exports.underscoredToCamelCase = require('./cjs/redux/naming').underscoredToCamelCase

exports.event_name = require('./cjs/redux/naming').event_name
exports.eventName  = exports.event_name

exports.goto       = require('./cjs/redux/actions').goto_action
exports.redirect   = require('./cjs/redux/actions').redirect_action
exports.load_state = require('./cjs/redux/actions').load_state_action
exports.loadState  = exports.load_state

exports.PRELOAD    = require('./cjs/redux/preload/actions').Preload
exports.LoadState  = require('./cjs/redux/actions').LoadState
exports.LOAD_STATE = exports.LoadState
exports.GoTo       = require('./cjs/redux/actions').GoTo
exports.GO_TO      = exports.GoTo
exports.Redirect   = require('./cjs/redux/actions').Redirect
exports.REDIRECT   = exports.Redirect
exports.Navigated  = require('./cjs/redux/actions').Navigated
exports.NAVIGATED  = exports.Navigated

exports.Link = require('./cjs/redux/Link').default
exports.IndexLink = require('./cjs/redux/IndexLink').default

exports.websocket = require('./cjs/redux/client/websocket').default

exports.get_cookie = require('./cjs/client/cookies').get_cookie
exports.getCookie  = exports.get_cookie

exports.replace_location = require('./cjs/react-router/location').replace_location
exports.replaceLocation  = exports.replace_location

exports.push_location = require('./cjs/react-router/location').push_location
exports.pushLocation  = exports.push_location