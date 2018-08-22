import {
	PRELOAD_STARTED,
	PRELOAD_FINISHED,
	PRELOAD_FAILED
} from './actions'

// `@preload()` reducer
export default function(state = { pending : false, immediate : false }, action = {})
{
	switch (action.type)
	{
		case PRELOAD_STARTED  : return { ...state, pending: true,  immediate : action.immediate || false, error: undefined }
		case PRELOAD_FINISHED : return { ...state, pending: false, immediate : false }
		case PRELOAD_FAILED   : return { ...state, pending: false, immediate : false, error: action.error }
		default               : return state
	}
}
