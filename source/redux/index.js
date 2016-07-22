// just an npm package helper

import { push, replace } from 'redux-router'

import client  from './client'
import preload from './preload'

export { client as render, preload }

export { Preload_started, Preload_finished, Preload_failed, Preload_method_name, Preload_blocking_method_name } from './middleware/preloading middleware'

export const goto     = push
export const redirect = replace