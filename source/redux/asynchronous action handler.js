import { event_name } from './naming'
import normalize_common_settings from './normalize'

// Returns Redux action creator.
// `promise` is for backwards compatibility:
// it has been renamed to `action` since `9.0.8`.
export function action(options, handler)
{
	// Sanity check
	if (!handler)
	{
		throw new Error('You must pass "handler" as the second argument of "action()"')
	}

	let { type, namespace, event, promise, action, payload, result } = options

	// For those who still prefer `type` over `event`
	if (!event && type)
	{
		event = type
	}

	// If `result` is a property name,
	// then add that property to the `connector`.
	if (typeof result === 'string')
	{
		handler.add_state_properties(result)
	}

	// Default "on result" handler
	result = result || (state => state)

	// Asynchronous action
	if (promise || action)
	{
		// Normalize `result` reducer into a function
		if (typeof result === 'string')
		{
			const property = result
			result = (state, result) =>
			({
				...state,
				[property]: result
			})
		}

		// Adds Redux reducers handling events:
		//
		//   * pending
		//   * success
		//   * error
		//
		create_redux_handlers(handler, namespace, event, result)

		// Redux "action creator"
		return (...parameters) =>
		({
			event   : event_name(namespace, event),
			promise : http => (action || promise).apply(this, parameters.concat(http))
		})
	}

	// Synchronous action

	// Normalize `result` reducer into a function
	if (typeof result === 'string')
	{
		payload = parameter => ({ parameter })

		const property = result
		result = (state, action) =>
		({
			...state,
			[property]: action.parameter
		})
	}

	// Reducer
	handler.handle(event_name(namespace, event), result)

	// Redux "action creator"
	return (...parameters) =>
	({
		type : event_name(namespace, event),
		...(payload ? payload.apply(this, parameters) : undefined)
	})
}

// Creates Redux handler object
// (which will eventually be transformed into a reducer)
export function create_handler(settings)
{
	settings = normalize_common_settings(settings, { full: false })

	const handlers = {}
	const registered_state_properties = []

	const result =
	{
		settings,

		handle(event, handler)
		{
			handlers[event] = handler
		},

		reducer(initial_state = {})
		{
			// applies a handler based on the action type
			// (is copy & paste'd for all action response handlers)
			return function(state = initial_state, action_data = {})
			{
				const handler = handlers[action_data.type]

				if (!handler)
				{
					return state
				}

				let handler_argument = action_data

				if (action_data.result !== undefined)
				{
					handler_argument = action_data.result
				}
				else if (action_data.error !== undefined)
				{
					handler_argument = action_data.error
				}
				// This proved to be not that convenient
				// // When only `type` of a Redux "action" is set
				// else if (Object.keys(action_data).length === 1)
				// {
				// 	handler_argument = undefined
				// }

				// For some strange reason Redux didn't report
				// these errors to the console, hence the manual `console.error`.
				try
				{
					return handler(state, handler_argument)
				}
				catch (error)
				{
					console.error(error)
					throw error
				}
			}
		},

		registered_state_properties,

		add_state_properties()
		{
			registered_state_properties.push.apply(registered_state_properties, arguments)
		}
	}

	result.addStateProperties = result.add_state_properties

	return result
}

// Adds handlers for:
//
//   * pending
//   * done
//   * failed
//   * reset error
//
function create_redux_handlers(handler, namespace, event, on_result)
{
	if (!handler.settings.asynchronous_action_event_naming)
	{
		throw new Error("`asynchronousActionEventNaming` function parameter was not passed")
	}
	
	if (!handler.settings.asynchronous_action_handler_state_property_naming)
	{
		throw new Error("`asynchronousActionHandlerStatePropertyNaming` function parameter was not passed")
	}

	const
	[
		pending_event_name,
		success_event_name,
		error_event_name
	]
	= handler.settings.asynchronous_action_event_naming(event)

	const pending_property_name = handler.settings.asynchronous_action_handler_state_property_naming(pending_event_name)
	const error_property_name   = handler.settings.asynchronous_action_handler_state_property_naming(error_event_name)

	// This info will be used in `storeConnector`
	handler.add_state_properties(pending_property_name, error_property_name)

	// When Promise is created,
	// clear `error`,
	// set `pending` flag.
	handler.handle(event_name(namespace, pending_event_name), (state, result) =>
	({
		...state,
		// Set `pending` flag
		[pending_property_name] : true,
		// Clear `error`
		[error_property_name] : undefined
	}))

	// When Promise succeeds
	handler.handle(event_name(namespace, success_event_name), (state, result) =>
	{
		// This will be the new Redux state
		const new_state = on_result(state, result)

		// Clear `pending` flag
		new_state[pending_property_name] = false

		// Return the new Redux state
		return new_state
	})

	// When Promise fails, clear `pending` flag and set `error`.
	// Can also clear `error` when no `error` is passed as part of an action.
	handler.handle(event_name(namespace, error_event_name), (state, error) =>
	({
		...state,
		[pending_property_name] : false,
		[error_property_name] : error
	}))
}

// Returns Redux action creator for resetting error.
export function reset_error({ namespace, event }, handler)
{
	const
	[
		pending_event_name,
		success_event_name,
		error_event_name
	]
	= handler.settings.asynchronous_action_event_naming(event)

	// Redux "action creator"
	return () =>
	({
		type  : event_name(namespace, error_event_name),
		error : null
	})
}

// A little helper for Redux `@connect()`
export function state_connector(handler)
{
	return function connect_state(state)
	{
		const result = {}

		for (let property_name of handler.registered_state_properties)
		{
			result[property_name] = state[property_name]
		}

		return result
	}
}