// import { reduxReactRouter } from '../redux-router/server'
import createHistory from 'history/lib/createMemoryHistory'
import create_store from '../store'

// reduxReactRouter, 

export default function create_store_on_server(reducer, settings)
{
	return create_store(createHistory, reducer, settings)
}