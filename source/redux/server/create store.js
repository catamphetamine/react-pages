import set_up_http_client from '../http client'
import create_store from '../store'

export default function createStore(settings, data, history, http_client)
{
	// create Redux store
	const store = create_store(settings.reducer, history,
	{
		server: true,
		routes: settings.routes,
		data,
		middleware: settings.redux_middleware,
		on_store_created: settings.on_store_created,
		asynchronous_action_event_naming: settings.asynchronous_action_event_naming,
		on_preload_error : settings.preload && settings.preload.catch,
		http_client,
		preload_helpers : settings.preload && settings.preload.helpers,
		on_navigate     : settings.on_navigate
	})

	// Customization of `http` utility
	// which can be used inside Redux action creators
	set_up_http_client(http_client,
	{
		store,
		on_before_send : settings.http && settings.http.request
	})

	return store
}