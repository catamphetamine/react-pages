// just an npm package helper

import { webpage_head, webpage_title, webpage_meta } from './source/webpage head'

import client from './source/client'

export const head  = webpage_head
export const title = webpage_title
export const meta  = webpage_meta

export { client as render }