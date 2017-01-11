// Helpers

var head = require('./build/webpage head')

var webpage_head = head.webpage_head
var webpage_title = head.webpage_title
var webpage_meta = head.webpage_meta

exports.head  = webpage_head
exports.title = webpage_title
exports.meta  = webpage_meta

// Redux

exports.preload = require('./build/redux/preload').default
exports.render = require('./build/redux/client/client').default

var preloading_middleware = require('./build/redux/middleware/preloading middleware')

exports.Preload_started      = preloading_middleware.Preload_started
exports.PRELOAD_STARTED      = exports.Preload_started
exports.Preload_finished     = preloading_middleware.Preload_finished
exports.PRELOAD_FINISHED     = exports.Preload_finished
exports.Preload_failed       = preloading_middleware.Preload_failed
exports.PRELOAD_FAILED       = exports.Preload_failed
exports.Preload_method_name  = preloading_middleware.Preload_method_name
exports.PRELOAD_METHOD_NAME  = exports.Preload_method_name
exports.Preload_options_name = preloading_middleware.Preload_options_name
exports.PRELOAD_OPTIONS_NAME = exports.Preload_options_name

exports.action = require('./build/redux/asynchronous action handler').action
exports.create_handler = require('./build/redux/asynchronous action handler').create_handler
exports.createHandler = exports.create_handler
exports.state_connector = require('./build/redux/asynchronous action handler').state_connector
exports.stateConnector = exports.state_connector

exports.underscoredToCamelCase = require('./build/redux/naming').underscoredToCamelCase

exports.event_name = require('./build/redux/naming').event_name
exports.eventName  = exports.event_name

// var redux_router = require('./build/redux/redux-router')

// exports.goto     = redux_router.push
// exports.redirect = redux_router.replace

exports.goto     = function(location) { return { type: '@@react-isomorphic-render/goto', location } }
exports.redirect = function(location) { return { type: '@@react-isomorphic-render/redirect', location } }

exports.Link = require('./build/redux/link').default

// exports.onEnter = require('./build/redux/on enter').default