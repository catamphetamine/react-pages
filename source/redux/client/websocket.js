import WebSocket from 'robust-websocket'
import CustomEvent from '../../custom event'

// Sets up WebSocket connection
export default function set_up_websocket_connection(settings)
{
	return function(authentication_token)
	{
		const websocket = new WebSocket(`${settings.secure ? 'wss' : 'ws'}://${settings.host}:${settings.port}`, undefined,
		{
			// Exponential backoff, but no less that once in a minute
			shouldReconnect(event, websocket)
			{
				return Math.min(Math.pow(1.5, websocket.attempts) * 500, 60 * 1000)
			}
		})

		websocket.addEventListener('message', (event) =>
		{
			const message = JSON.parse(event.data)

			if (message.type)
			{
				store.dispatch(message)
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

			addEventListener(event_name, listener)
			{
				return websocket.addEventListener(event_name, listener)
			},

			onOpen(listener)
			{
				return websocket.addEventListener('open', listener)
			},

			onClose(listener)
			{
				return websocket.addEventListener('close', listener)
			},

			onError(listener)
			{
				return websocket.addEventListener('error', listener)
			},

			onMessage(listener)
			{
				return websocket.addEventListener('message', (event) =>
				{
					listener(JSON.parse(event.data))
				})
			}
		}

		return _websocket
	}
}