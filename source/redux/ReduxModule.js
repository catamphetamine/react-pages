import { eventName } from './naming'
import normalize_common_settings from './normalize'

import { RESULT_ACTION_PROPERTY, ERROR_ACTION_PROPERTY } from './middleware/asynchronous'

// Creates Redux module object
// (which will eventually be transformed into a reducer)
export default function createReduxModule(namespace, settings)
{
	const redux = new ReduxModule(namespace, settings)

	// Public aliases
	redux.resetError = redux.reset_error
	redux.properties = redux.add_state_properties
	redux.property = redux.add_state_properties

	// Deprecated.
	redux.getProperties = redux.get_properties

	return redux
}

class ReduxModule
{
	handlers = {}
	registered_state_properties = []

	constructor(namespace = `REACT_WEBSITE_${counter.next()}`, settings = {})
	{
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

	on(namespace, event, handler)
	{
		if (typeof event === 'function')
		{
			handler = event
			event = namespace
			namespace = undefined
		}
		else
		{
			// Use "success" event name.
			event = this.settings.reduxEventNaming(eventName(namespace, event))[1]
		}

		if (!this.handlers[event])
		{
			this.handlers[event] = []
		}

		this.handlers[event].push(handler)
	}

	action(event, action, result, options)
	{
		// Autogenerate `event` name.
		if (typeof event !== 'string')
		{
			options = result
			result = action
			action = event
			event = `REACT_WEBSITE_ACTION_${counter.next()}`
		}

		options = options || {}

		if (typeof action !== 'function')
		{
			throw new Error('[react-website] One must pass an `action()` argument (the second one) to Redux module action creator: `reduxModule(event, action, result, options = {})`.')
		}

		return create_action(event, action, result, options, this)
	}

	simpleAction(event, action, result, options)
	{
		if (typeof event === 'string') {
			options = options || {}
			options.sync = true
		} else {
			result = result || {}
			result.sync = true
		}

		return this.action(event, action, result, options)
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
		= this.settings.reduxEventNaming(event)

		// Redux "action creator"
		return () =>
		({
			type  : eventName(this.namespace, error_event_name),
			error : undefined
		})
	}

	// Deprecated.
	get_properties = (state) =>
	{
		const properties = {}

		for (const property_name of this.registered_state_properties)
		{
			properties[property_name] = state[property_name]
		}

		return properties
	}

	// camelCased alias.
	// Deprecated.
	getProperties = (state) => this.get_properties(state)

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
	// then add that property to `connectXxx()`.
	if (typeof result === 'string')
	{
		redux.add_state_properties(result)
	}
	// If `result` is an object of property getters,
	// then add those properties to `connectXxx()`.
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
		redux.on(eventName(namespace, event), get_action_value_reducer(result))

		// Redux "action creator"
		return (...parameters) =>
		({
			type : eventName(namespace, event),
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
		event   : eventName(namespace, event),
		promise : (utility) =>
		{
			if (redux.v2) {
				// For gradual migration from version "2.x" syntax.
				return action.apply(this, [utility].concat(parameters))
			}
			return action.apply(this, parameters)(utility.http)
		},
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
	if (!redux.settings.reduxEventNaming)
	{
		throw new Error("`reduxEventNaming` function parameter was not passed")
	}

	if (!redux.settings.reduxPropertyNaming)
	{
		throw new Error("`reduxPropertyNaming` function parameter was not passed")
	}

	const
	[
		pending_event_name,
		success_event_name,
		error_event_name
	]
	= redux.settings.reduxEventNaming(event)

	const pending_property_name = redux.settings.reduxPropertyNaming(pending_event_name)
	const error_property_name   = redux.settings.reduxPropertyNaming(error_event_name)

	// This info will be used in `storeConnector`
	redux.add_state_properties(pending_property_name, error_property_name)

	// When Promise is created: reset result variable, clear `error`, set `pending` flag.
	redux.on(eventName(namespace, pending_event_name), (state) =>
	{
		const new_state =
		{
			...state,
			// Set `pending` flag
			[pending_property_name]: true
		}

		// Clear `error`
		if (redux.v2) {
			// For gradual migration from version "2.x" syntax.
			new_state[error_property_name] = undefined
		} else {
			delete new_state[error_property_name]
		}

		return new_state
	})

	// When Promise succeeds: clear `pending` flag, set result variable.
	redux.on(eventName(namespace, success_event_name), (state, result) =>
	{
		const new_state = result_reducer(state, result)

		// Clear `pending` flag
		if (redux.v2) {
			// For gradual migration from version "2.x" syntax.
			new_state[pending_property_name] = false
		} else {
			delete new_state[pending_property_name]
		}

		return new_state
	})

	// When Promise fails, clear `pending` flag and set `error`.
	// Can also clear `error` when no `error` is passed as part of an action.
	redux.on(eventName(namespace, error_event_name), (state, error) =>
	{
		const new_state =
		{
			...state,
			[error_property_name] : error
		}

		// Clear `pending` flag
		if (redux.v2) {
			// For gradual migration from version "2.x" syntax.
			new_state[pending_property_name] = false
		} else {
			delete new_state[pending_property_name]
			// `resetError()`
			if (!error) {
				delete new_state[error_property_name]
			}
		}

		return new_state
	})
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

class Counter
{
	counter = 0

	next()
	{
		if (this.counter < MAX_SAFE_INTEGER) {
			this.counter++
		} else {
			this.counter = 1
		}
		return this.counter
	}
}

const counter = new Counter()

// `MAX_SAFE_INTEGER` is not supported by older browsers
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1
