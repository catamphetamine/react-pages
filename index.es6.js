// Helpers

import { webpage_head, webpage_title, webpage_meta } from './es6/webpage head'

export const head  = webpage_head
export const title = webpage_title
export const meta  = webpage_meta

// Redux

import { push, replace } from 'redux-router'

import client  from './es6/redux/client/client'
import preload from './es6/redux/preload'

export { client as render, preload }

export
{
	Preload_started,
	Preload_started as PRELOAD_STARTED,
	Preload_finished,
	Preload_finished as PRELOAD_FINISHED,
	Preload_failed,
	Preload_failed as PRELOAD_FAILED,
	Preload_method_name,
	Preload_method_name as PRELOAD_METHOD_NAME,
	Preload_options_name,
	Preload_options_name as PRELOAD_OPTIONS_NAME
}
from './es6/redux/middleware/preloading middleware'

export const goto     = push
export const redirect = replace

export { default as onEnter } from './es6/redux/on enter'