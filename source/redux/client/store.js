// import { reduxReactRouter } from '../redux-router'
import createHistory from 'history/lib/createBrowserHistory'
import create_store from '../store'

export default function create_store_on_client(reducer, settings)
{
	// reduxReactRouter, 
	return create_store(createHistory, reducer, settings)
}