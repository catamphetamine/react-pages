import { getFromContext } from '../context.js'

export function isServerSideLoaded() {
	return getFromContext('InitialPage/ServerSideRendered') && !getFromContext('InitialPage/RepeatLoadOnClientSideRender')
}

export function isServerSideRendered() {
	return getFromContext('InitialPage/ServerSideRendered') && !getFromContext('InitialPage/ServerSideRenderedEmpty')
}