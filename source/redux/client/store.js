import { reduxReactRouter } from 'redux-router'
import createHistory from 'history/lib/createBrowserHistory'
import create_store from '../store'

export default function create_store_on_client(get_reducer, settings)
{
	return create_store(reduxReactRouter, createHistory, get_reducer, settings)
}