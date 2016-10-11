import { reduxReactRouter } from 'redux-router/server'
import createHistory from 'history/lib/createMemoryHistory'
import create_store from '../store'

export default function create_store_on_server(get_reducer, settings)
{
	return create_store(reduxReactRouter, createHistory, get_reducer, settings)
}