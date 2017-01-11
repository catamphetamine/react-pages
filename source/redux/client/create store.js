import Http_client from '../../http client'
import set_up_http_client from '../http client'
import _create_store from './store'

export default function create_store(common, data, http_client, devtools)
{
	// create ("rehydrate") Redux store
	const store = _create_store(common.reducer,
	{
		devtools,
		middleware           : common.redux_middleware,
		on_store_created     : common.on_store_created,
		asynchronous_action_event_naming : common.asynchronous_action_event_naming,
		on_preload_error     : common.preload && common.preload.catch,
		preload_helpers      : common.preload && common.preload.helpers,
		routes               : common.routes,
		on_navigate          : common.on_navigate,
		history_options      : common.history,
		data,
		http_client
	})

	// Customization of `http` utility
	// which can be used inside Redux action creators
	set_up_http_client(http_client,
	{
		store,
		on_before_send : common.http && common.http.request
	})

	return store
}