import {
	Preload_started,
	Preload_finished,
	Preload_failed
} from './actions'

// `@preload()` reducer
export default function(state = { pending : false, immediate : false }, action = {})
{
	switch (action.type)
	{
		case Preload_started  : return { ...state, pending: true,  immediate : action.immediate || false, error: undefined }
		case Preload_finished : return { ...state, pending: false, immediate : false }
		case Preload_failed   : return { ...state, pending: false, immediate : false, error: action.error }
		default               : return state
	}
}
