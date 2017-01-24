import WebSocket from 'robust-websocket'
import CustomEvent from '../../custom event'

// Sets up WebSocket connection
export default function set_up_websocket_connection(settings)
{
	return function(authentication_token, store)
	{
		const websocket = new WebSocket(`${settings.secure ? 'wss' : 'ws'}://${settings.host}:${settings.port}`, undefined,
		{
			// If a number returned then it's gonna be a delay
			// before reconnect is attempted.
			// If anything else is returned (`null`, `undefined`, `false`)
			// then it means "don't try to reconnect".
			//
			// `event` is either a `CloseEvent`
			// or an online/offline `navigator` event.
			//
			shouldReconnect(event, websocket)
			{
				// https://github.com/appuri/robust-websocket/issues/8
				//
				// 1011 (500) is not retried by the default shouldReconnect.
				// a 500 will usually either be a big in the server
				// that the code is hitting, and retrying won't help,
				// or the server is down and getting slammed,
				// and retrying will just slam it more.
				// Sure the server will probably eventually come back up
				// so retrying it at a longer interval would be fine.
				//
				// 1008 (400) means the request you formed is bad.
				// If you try the exact same request again, you should always get 400.
				// 400 is not a transient error. If it is, the API is using the wrong status code.
				//
				if (event.code === 1008 || event.code === 1011)
				{
					// Retry in 15-30 minutes
					return (15 + Math.random() * 15) * 60 * 1000
				}

				// Exponential backoff, but no less that once in a minute
				return Math.min(Math.pow(1.5, websocket.attempts) * 500, 60 * 1000)
			}
		})

		const _websocket =
		{
			send(message)
			{
				if (authentication_token)
				{
					message =
					{
						...message,
						token: authentication_token
					}
				}

				return websocket.send(JSON.stringify(message))
			},

			close()
			{
				return websocket.close()
			},

			listen(event_name, listener)
			{
				const enhanced_listener = (event) => listener(event, store)

				websocket.addEventListener(event_name, enhanced_listener)

				// Returns `unlisten()`
				return () => websocket.removeEventListener(event_name, enhanced_listener)
			},

			onOpen(listener)
			{
				return _websocket.listen('open', listener)
			},

			onClose(listener)
			{
				return _websocket.listen('close', listener)
			},

			onError(listener)
			{
				return _websocket.listen('error', listener)
			},

			onMessage(listener)
			{
				return _websocket.listen('message', (event, store) =>
				{
					return listener(JSON.parse(event.data), store)
				})
			}
		}

		_websocket.onMessage((message, store) =>
		{
			if (message.type)
			{
				store.dispatch(message)
			}
		})

		return _websocket
	}
}