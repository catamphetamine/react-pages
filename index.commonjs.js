// Redux

var PreloadActions = require('./commonjs/redux/preload/actions')

exports.PRELOAD_STARTED  = PreloadActions.PRELOAD_STARTED
exports.PRELOAD_FINISHED = PreloadActions.PRELOAD_FINISHED
exports.PRELOAD_FAILED   = PreloadActions.PRELOAD_FAILED

exports.indicateLoading = PreloadActions.indicateLoading

exports.Loading = require('./commonjs/components/Loading').default

exports.updateMeta = require('./commonjs/meta/meta').patchMeta

exports.getState = require('./commonjs/redux/client/getState').default
exports.getHttpClient = require('./commonjs/redux/client/getHttpClient').default

exports.wasInstantNavigation = require('./commonjs/redux/client/instantNavigation').wasInstantNavigation
exports.isInstantBackAbleNavigation = require('./commonjs/redux/client/instantNavigation').isInstantBackAbleNavigation
exports.canGoBackInstantly = require('./commonjs/redux/client/instantNavigation').canGoBackInstantly
exports.canGoForwardInstantly = require('./commonjs/redux/client/instantNavigation').canGoForwardInstantly

exports.getPreferredLocales   = require('./commonjs/client/locale').getPreferredLocales
exports.getPreferredLocale    = require('./commonjs/client/locale').getPreferredLocale
exports.getLanguageFromLocale = require('./commonjs/locale').getLanguageFromLocale

exports.ReduxModule = require('./commonjs/redux/ReduxModule').default

exports.underscoredToCamelCase = require('./commonjs/redux/naming').underscoredToCamelCase
exports.eventName = require('./commonjs/redux/naming').eventName

exports.Link = require('./commonjs/redux/Link').default

exports.getCookie = require('./commonjs/client/cookies').getCookie

exports.Route = require('./commonjs/router').Route
exports.Redirect = require('./commonjs/router').Redirect
exports.useRouter = require('./commonjs/router').useRouter
exports.goto = require('./commonjs/router').goto
exports.redirect = require('./commonjs/router').redirect
exports.pushLocation = require('./commonjs/router').pushLocation
exports.replaceLocation = require('./commonjs/router').replaceLocation
exports.goBack = require('./commonjs/router').goBack
exports.goForward = require('./commonjs/router').goForward

exports.useLocation = require('./modules/router/useLocation').default