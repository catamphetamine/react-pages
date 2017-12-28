import { event_name } from './naming'
import normalize_common_settings from './normalize'

import { RESULT_ACTION_PROPERTY, ERROR_ACTION_PROPERTY } from './middleware/asynchronous'

// Creates Redux module object
// (which will eventually be transformed into a reducer)
export default function create_redux_module(namespace, settings)
{
	const redux = new Redux_module(namespace, settings)

	// Public aliases
	redux.getProperties = redux.get_properties
	redux.resetError = redux.reset_error
	redux.properties = redux.add_state_properties
	redux.property = redux.add_state_properties

	return redux
}

class Redux_module
{
	handlers = {}
	registered_state_properties = []

	constructor(namespace, settings = {})
	{
		// Sanity check
		if (typeof namespace !== 'string')
		{
			throw new Error("`namespace: String` argument not passed to `reduxModule(namespace, [settings])`")
		}

		// This is later being read by `action()`s to reduce copy-pasta
		this.namespace = namespace

		this.settings = normalize_common_settings(settings, { full: false })
	}

	replace(event, handler)
	{
		if (!Array.isArray(handler))
		{
			handler = [handler]
		}

		this.handlers[event] = handler
	}

	on(event, handler)
	{
		if (!this.handlers[event])
		{
			this.handlers[event] = []
		}

		this.handlers[event].push(handler)
	}

	action(event, action, result, options = {})
	{
		if (typeof action !== 'function')
		{
			throw new Error('[react-website] One must pass an `action()` argument (the second one) to Redux module action creator: `reduxModule(event, action, result, options = {})`.')
		}

		return create_action(event, action, result, options, this)
	}

	// Returns Redux action creator for resetting error.
	reset_error(event)
	{
		const
		[
			pending_event_name,
			success_event_name,
			error_event_name
		]
		= this.settings.redux_event_naming(event)

		// Redux "action creator"
		return () =>
		({
			type  : event_name(this.namespace, error_event_name),
			error : null
		})
	}

	get_properties = (state) =>
	{
		const properties = {}

		for (const property_name of this.registered_state_properties)
		{
			properties[property_name] = state[property_name]
		}

		return properties
	}

	// camelCased alias
	getProperties = (state) =>
	{
		return this.get_properties(state)
	}

	reducer(initial_state = {})
	{
		// This is later used for resetting variables
		// being fetched to their initial values.
		this.initial_state = initial_state

		// applies a handler based on the action type
		// (is copy & paste'd for all action response handlers)
		return (state = initial_state, action_data = {}) =>
		{
			const event_handlers = this.handlers[action_data.type]

			if (!event_handlers || event_handlers.length === 0)
			{
				return state
			}

			let handler_argument = action_data

			// if (action_data.value !== undefined)
			if (Object.prototype.hasOwnProperty.call(action_data, RESULT_ACTION_PROPERTY))
			{
				handler_argument = action_data[RESULT_ACTION_PROPERTY]
			}
			else if (action_data[ERROR_ACTION_PROPERTY] !== undefined)
			{
				handler_argument = action_data[ERROR_ACTION_PROPERTY]
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
				for (const event_handler of event_handlers)
				{
					state = event_handler(state, handler_argument)
				}

				return state
			}
			catch (error)
			{
				console.error(error)
				throw error
			}
		}
	}

	add_state_properties()
	{
		this.registered_state_properties.push.apply(this.registered_state_properties, arguments)
	}
}

// Returns Redux action creator.
function create_action(event, action, result, options, redux)
{
	const namespace = redux.namespace

	const
	{
		sync,
		cancelPrevious
	}
	= options

	// If `result` is a property name,
	// then add that property to the `connector`.
	if (typeof result === 'string')
	{
		redux.add_state_properties(result)
	}
	// If `result` is an object of property getters,
	// then add those properties to the `connector`.
	else if (typeof result === 'object')
	{
		redux.add_state_properties(...Object.keys(result))
	}

	// Default "on result" handler is a reducer that does nothing
	result = result || (state => state)

	// Synchronous action
	if (sync)
	{
		// Reducer
		redux.on(event_name(namespace, event), get_action_value_reducer(result))

		// Redux "action creator"
		return (...parameters) =>
		({
			type : event_name(namespace, event),
			[RESULT_ACTION_PROPERTY] : action.apply(this, parameters)
		})
	}

	// Asynchronous action

	// Add Redux reducers handling events:
	//
	//   * pending
	//   * success
	//   * error
	//
	add_asynchronous_action_reducers(redux, namespace, event, get_action_value_reducer(result))

	// Redux "action creator"
	return (...parameters) =>
	({
		event   : event_name(namespace, event),
		promise : (utility) => action.apply(this, [utility].concat(parameters)),
		cancelPrevious
	})
}

// Adds handlers for:
//
//   * pending
//   * done
//   * failed
//   * reset error
//
function add_asynchronous_action_reducers(redux, namespace, event, result_reducer)
{
	if (!redux.settings.redux_event_naming)
	{
		throw new Error("`reduxEventNaming` function parameter was not passed")
	}
	
	if (!redux.settings.redux_property_naming)
	{
		throw new Error("`reduxPropertyNaming` function parameter was not passed")
	}

	const
	[
		pending_event_name,
		success_event_name,
		error_event_name
	]
	= redux.settings.redux_event_naming(event)

	const pending_property_name = redux.settings.redux_property_naming(pending_event_name)
	const error_property_name   = redux.settings.redux_property_naming(error_event_name)

	// This info will be used in `storeConnector`
	redux.add_state_properties(pending_property_name, error_property_name)

	// When Promise is created: reset result variable, clear `error`, set `pending` flag.
	redux.on(event_name(namespace, pending_event_name), (state) =>
	{
		// This will be the new Redux state.
		return {
			...state,

			// Set `pending` flag
			[pending_property_name]: true,

			// Clear `error`
			[error_property_name]: undefined
		}
	})

	// When Promise succeeds: clear `pending` flag, set result variable.
	redux.on(event_name(namespace, success_event_name), (state, result) =>
	{
		// This will be the new Redux state
		const new_state = result_reducer(state, result)

		// Clear `pending` flag
		new_state[pending_property_name] = false

		// Return the new Redux state
		return new_state
	})

	// When Promise fails, clear `pending` flag and set `error`.
	// Can also clear `error` when no `error` is passed as part of an action.
	redux.on(event_name(namespace, error_event_name), (state, error) =>
	({
		...state,
		[pending_property_name] : false,
		[error_property_name] : error
	}))
}

// Returns a function
function get_action_value_reducer(reducer)
{
	// If `reducer` is a property name,
	// then the reducer will write action value
	// to that property of Redux state.
	if (typeof reducer === 'string')
	{
		return (state, value) =>
		({
			...state,
			[reducer]: value
		})
	}

	// If `reducer` is an object of property getters
	// then those properties will be added to Redux state.
	if (typeof reducer === 'object')
	{
		return (state, value) =>
		{
			const updated_properties = {}

			for (const property of Object.keys(reducer))
			{
				updated_properties[property] = reducer[property](value)

				// Don't know why did I previously write it like:	
				// updated_properties =
				// {
				// 	...updated_properties,
				// 	...reducer[property](value)
				// }
			}

			return {
				...state,
				...updated_properties
			}
		}
	}

	// Otherwise `reducer` is `(state, value) => ...`
	return reducer
}