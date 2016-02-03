// just an npm package helper

import { webpage_head, webpage_title } from './webpage head'

export const head = webpage_head
export const title = webpage_title

import client from './client'

export { client as render }