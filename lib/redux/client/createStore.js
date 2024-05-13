import createHistoryProtocol from '../../router/client/createHistoryProtocol.js'
import createStore_ from '../store.js'
import createHttpClient from '../HttpClient.js'
import normalizeSettings from '../normalize.js'
import { getCookie } from '../../client/cookies.js'
import { getFromContext } from '../../context.js'

/**
 * Creates a Redux store.
 * @param  {object} settings
 * @param  {object} [options]
 * @return {object} store
 */
export default function createStore(settings, options = {}, { stash }) {
	const {
		devtools,
		stats,
		onBeforeNavigate,
		onPageRendered: onNavigationFinished,
		onStoreCreated,
		getLoadContext
	} = options

	settings = normalizeSettings(settings)

	// Redux store.
	// This variable is used in `httpClient`,
	// that's why it's declared at the top.
	let store

	// Create HTTP client (Redux action creator `http` utility)
	const httpClient = createHttpClient(settings, () => store, { fetch })

	// Store the reference to `httpClient` in `window` for WebSocket message handlers.
	// WebSocket handlers only run on the client side, so it's fine storing the `httpClient`
	// in `window`.
	window._ReactPages_HttpClient = httpClient

	const initialState = getFromContext('App/ReduxStateServerSideSnapshot')

	// Create Redux store
	store = createStore_({
		initialState,
		createHistoryProtocol,
		httpClient,
		stash,
		settings,
		options: {
			devtools,
			stats,
			onBeforeNavigate,
			onNavigationFinished,
			getCookie,
			context: getLoadContext && getLoadContext({
				dispatch: (action) => store.dispatch(action)
			})
		}
	})

	// `onStoreCreated(store)` is called here.
	//
	// For example, client-side-only applications
	// may capture this `store` as `window.store`
	// to call `bindActionCreators()` for all actions (globally).
	//
	// onStoreCreated: store => window.store = store
	//
	// import { bindActionCreators } from 'redux'
	// import actionCreators from './actions'
	// const boundActionCreators = bindActionCreators(actionCreators, window.store.dispatch)
	// export default boundActionCreators
	//
	// Not saying that this is even a "good" practice,
	// more like "legacy code", but still my employer
	// happened to have such binding, so I added this feature.
  // Still this technique cuts down on a lot of redundant "wiring" code.
  //
	if (onStoreCreated) {
		onStoreCreated(store)
	}

	return store
}