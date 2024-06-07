// export { default as updateMeta } from './lib/meta/patchMeta.js'

export { default as getHttpClient } from './lib/redux/client/getHttpClient.js'

export {
	getPreferredLocale,
	getPreferredLocales
} from './lib/client/locale.js'

export {
	default as getLanguageFromLocale
} from './lib/getLanguageFromLocale.js'

export {
	wasInstantNavigation,
	canGoBackInstantly,
	canGoForwardInstantly
} from './lib/redux/client/instantNavigation.js'

export {
	default as ReduxModule
} from './lib/redux/ReduxModule.js'

export {
	underscoredToCamelCase,
	eventName
} from './lib/redux/naming.js'

export {
	default as Link
} from './lib/redux/Link.js'

export {
	getCookie
} from './lib/client/cookies.js'

export {
	Redirect,
	useRouter
} from './lib/router/index.js'

export {
	goto,
	redirect,
	pushLocation,
	replaceLocation,
	goBack,
	goBackTwoPages,
	goForward
} from './lib/router/actions.js'

export { default as useBeforeNavigateToAnotherPage } from './lib/router/useBeforeNavigateToAnotherPage.js'
export { default as useBeforeRenderAnotherPage } from './lib/router/useBeforeRenderAnotherPage.js'
// export { default as useAfterNavigatedToAnotherPage } from './lib/router/useAfterNavigatedToAnotherPage.js'
export { default as useAfterRenderedThisPage } from './lib/router/useAfterRenderedThisPage.js'
export { default as useBeforeRenderNewPage } from './lib/router/useBeforeRenderNewPage.js'
export { default as useAfterRenderedNewPage } from './lib/router/useAfterRenderedNewPage.js'
export { default as useNavigationLocation } from './lib/redux/navigation/useNavigationLocation.js'
export { default as usePageStateSelector } from './lib/redux/usePageStateSelector.js'
export { default as usePageStateSelectorOutsideOfPage } from './lib/redux/usePageStateSelectorOutsideOfPage.js'
export { default as useLocation } from './lib/router/useLocation.js'
export { default as useLocationHistory } from './lib/router/useLocationHistory.js'
export { default as useGoBack } from './lib/router/useGoBack.js'
export { default as useGoForward } from './lib/router/useGoForward.js'
export { default as useNavigate } from './lib/router/useNavigate.js'
export { default as useRedirect } from './lib/router/useRedirect.js'
export { default as useLoading } from './lib/router/useLoading.js'
export { default as useRoute } from './lib/router/useRoute.js'

export { updateReducers } from './lib/redux/hotReload.js'
