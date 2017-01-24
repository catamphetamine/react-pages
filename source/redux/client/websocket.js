import WebSocket from 'robust-websocket'
import CustomEvent from '../../custom event'

// Sets up WebSocket connection
export default function set_up_websocket_connection(settings)
{
	return function(authentication_token, store)
	{
		const websocket = new WebSocket(`${settings.secure ? 'wss' : 'ws'}://${settings.host}:${settings.port}`, undefined,
		{
			// Exponential backoff, but no less that once in a minute
			shouldReconnect(event, websocket)
			{
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
				return websocket.listen('message', (event, store) =>
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