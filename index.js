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
	isInstantBackAbleNavigation,
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

export { default as useNavigationStartEffect } from './lib/router/useNavigationStartEffect.js'
export { default as useNavigationEndEffect } from './lib/router/useNavigationEndEffect.js'
export { default as useNavigationLocation } from './lib/redux/navigation/useNavigationLocation.js'
export { default as useSelectorForLocation } from './lib/redux/useSelectorForLocation.js'
export { default as useLocation } from './lib/router/useLocation.js'
export { default as useLocationHistory } from './lib/router/useLocationHistory.js'
export { default as useGoBack } from './lib/router/useGoBack.js'
export { default as useGoForward } from './lib/router/useGoForward.js'
export { default as useNavigate } from './lib/router/useNavigate.js'
export { default as useRedirect } from './lib/router/useRedirect.js'
export { default as useLoading } from './lib/router/useLoading.js'
export { default as useRoute } from './lib/router/useRoute.js'

export { updateReducers } from './lib/redux/hotReload.js'
