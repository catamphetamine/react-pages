import HttpClient from '../HttpClient.js'

export default function createHttpClient(settings, getStore, options = {}) {
	// Add `useSelector()` parameter to `http.onRequest()` function.
	let onBeforeSend
	if (settings.http.onRequest) {
		onBeforeSend = (request, parameters) => {
			settings.http.onRequest(request, {
				...parameters,
				useSelector: getter => getter(getStore().getState())
			})
		}
	}

	const {
		accessToken,
		header: authTokenHeader
	} = settings.http.authentication || {}

	// Add `useSelector()` parameter to `accessToken()` function.
	let getAuthToken
	if (accessToken) {
		getAuthToken = (getCookie, helpers) => {
      // If a token is returned from this function, it gets sent as
      // `Authorization: Bearer {token}` HTTP header.
			return accessToken({
				...helpers,
				getCookie,
				useSelector: getter => getter(getStore().getState())
			})
		}
	}

	return new HttpClient({
		onBeforeSend,
		getAuthToken,
		authTokenHeader,
		catchToRetry: settings.http.catch,
		transformUrl: settings.http.transformUrl,
		parseDates: settings.http.findAndConvertIsoDateStringsToDateInstances,
		useCrossDomainCookies: settings.http.useCrossDomainCookies,
		...options
	})
}