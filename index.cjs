// exports.updateMeta = require('./commonjs/meta/patchMeta.js').default;

exports.getHttpClient = require('./commonjs/redux/client/getHttpClient.js').default;

exports.getPreferredLocale = require('./commonjs/client/locale.js').getPreferredLocale;
exports.getPreferredLocales = require('./commonjs/client/locale.js').getPreferredLocales;

exports.getLanguageFromLocale = require('./commonjs/getLanguageFromLocale.js').default;

exports.wasInstantNavigation = require('./commonjs/redux/client/instantNavigation.js').wasInstantNavigation;
exports.canGoBackInstantly = require('./commonjs/redux/client/instantNavigation.js').canGoBackInstantly;
exports.canGoForwardInstantly = require('./commonjs/redux/client/instantNavigation.js').canGoForwardInstantly;

exports.ReduxModule = require('./commonjs/redux/ReduxModule.js').default;

exports.underscoredToCamelCase = require('./commonjs/redux/naming.js').underscoredToCamelCase;
exports.eventName = require('./commonjs/redux/naming.js').eventName;

exports.Link = require('./commonjs/redux/Link.js').default;
exports.getCookie = require('./commonjs/client/cookies.js').getCookie;

exports.Redirect = require('./commonjs/router/index.js').Redirect;
exports.useRouter = require('./commonjs/router/index.js').useRouter;

exports.goto = require('./commonjs/router/actions.js').goto;
exports.redirect = require('./commonjs/router/actions.js').redirect;
exports.pushLocation = require('./commonjs/router/actions.js').pushLocation;
exports.replaceLocation = require('./commonjs/router/actions.js').replaceLocation;
exports.goBack = require('./commonjs/router/actions.js').goBack;
exports.goBackTwoPages = require('./commonjs/router/actions.js').goBackTwoPages;
exports.goForward = require('./commonjs/router/actions.js').goForward;

exports.useLoading = require('./commonjs/router/useLoading.js').default;
exports.useLocation = require('./commonjs/router/useLocation.js').default;
exports.useLocationHistory = require('./commonjs/router/useLocationHistory.js').default;
exports.useGoBack = require('./commonjs/router/useGoBack.js').default;
exports.useGoForward = require('./commonjs/router/useGoForward.js').default;
exports.useNavigate = require('./commonjs/router/useNavigate.js').default;
exports.useRedirect = require('./commonjs/router/useRedirect.js').default;
exports.usePageStateSelector = require('./commonjs/redux/usePageStateSelector.js').default;
exports.usePageStateSelectorOutsideOfPage = require('./commonjs/redux/usePageStateSelectorOutsideOfPage.js').default;
exports.useBeforeNavigateToAnotherPage = require('./commonjs/router/useBeforeNavigateToAnotherPage.js').default;
exports.useBeforeRenderAnotherPage = require('./commonjs/router/useBeforeRenderAnotherPage.js').default;
// exports.useAfterNavigatedToAnotherPage = require('./commonjs/router/useAfterNavigatedToAnotherPage.js').default;
exports.useAfterRenderedThisPage = require('./commonjs/router/useAfterRenderedThisPage.js').default;
exports.useBeforeRenderNewPage = require('./commonjs/router/useBeforeRenderNewPage.js').default;
exports.useAfterRenderedNewPage = require('./commonjs/router/useAfterRenderedNewPage.js').default;
exports.useNavigationLocation = require('./commonjs/redux/navigation/useNavigationLocation.js').default;
exports.useRoute = require('./commonjs/router/useRoute.js').default;

exports.updateReducers = require('./commonjs/redux/hotReload.js').updateReducers;
