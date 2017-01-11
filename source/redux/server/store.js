import createHistory from 'history/lib/createMemoryHistory'
import create_store from '../store'

export default function create_store_on_server(reducer, settings)
{
	return create_store(createHistory, reducer, settings)
}