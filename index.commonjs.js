// Helpers

exports.meta = require('./commonjs/meta/meta').default

// Redux

var PreloadActions = require('./commonjs/redux/preload/actions')

exports.PRELOAD_STARTED  = PreloadActions.PRELOAD_STARTED
exports.PRELOAD_FINISHED = PreloadActions.PRELOAD_FINISHED
exports.PRELOAD_FAILED   = PreloadActions.PRELOAD_FAILED

var preloadDecorator = require('./commonjs/redux/preload/decorator')

exports.PRELOAD_METHOD_NAME  = preloadDecorator.PRELOAD_METHOD_NAME
exports.PRELOAD_OPTIONS_NAME = preloadDecorator.PRELOAD_OPTIONS_NAME

exports.preload = preloadDecorator.default
exports.indicateLoading = PreloadActions.indicateLoading
exports.translate = require('./commonjs/redux/translate/decorator').default
exports.onPageLoaded = require('./commonjs/redux/client/onPageLoaded').default

exports.Loading = require('./commonjs/components/Loading').default

exports.render               = require('./commonjs/redux/client/client').default
exports.getState             = require('./commonjs/redux/client/client').getState
exports.getHttpClient        = require('./commonjs/redux/client/client').getHttpClient
exports.wasInstantNavigation = require('./commonjs/redux/client/instantBack').wasInstantNavigation

exports.getPreferredLocales   = require('./commonjs/client/locale').getPreferredLocales
exports.getPreferredLocale    = require('./commonjs/client/locale').getPreferredLocale
exports.getLanguageFromLocale = require('./commonjs/locale').getLanguageFromLocale

exports.ReduxModule = require('./commonjs/redux/ReduxModule').default
exports.reduxModule = require('./commonjs/redux/ReduxModule').createReduxModule

exports.underscoredToCamelCase = require('./commonjs/redux/naming').underscoredToCamelCase
exports.eventName = require('./commonjs/redux/naming').eventName

exports.Link = require('./commonjs/redux/Link').default

exports.getCookie = require('./commonjs/client/cookies').getCookie

exports.Route = require('./commonjs/router').Route
exports.Redirect = require('./commonjs/router').Redirect
exports.withRouter = require('./commonjs/router').withRouter
exports.goto = require('./commonjs/router').goto
exports.redirect = require('./commonjs/router').redirect
exports.pushLocation = require('./commonjs/router').pushLocation
exports.replaceLocation = require('./commonjs/router').replaceLocation
exports.goBack = require('./commonjs/router').goBack