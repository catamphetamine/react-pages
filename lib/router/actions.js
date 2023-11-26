// `@catamphetamine/found` is a fork of `found` with some changes:
// * `redux` and `react-redux` are `peerDependencies` instead of `dependencies`.
// * `farce` was replaced with `@catamphetamine/farce` (added `location.origin`)
import {
	ActionTypes as FoundActionTypes
} from '@catamphetamine/found'

import {
	Actions,
	ActionTypes
} from '@catamphetamine/farce'

import { markImmediateNavigationAsInstantBack } from '../redux/client/instantNavigation.js'

import { setInContext } from '../context.js'

export function redirect(location, { load } = {}) {
	if (load === false) {
		setInContext('Navigation/SkipLoad', true)
	}
	return Actions.replace(location)
}

export function goto(location, { load, instantBack } = {}) {
	if (load === false) {
		setInContext('Navigation/SkipLoad', true)
	}
	markImmediateNavigationAsInstantBack(instantBack)
	return Actions.push(location)
}

export function navigateThroughHistory(delta, { load } = {}) {
	if (load === false) {
		setInContext('Navigation/SkipLoad', true)
	}
	return Actions.go(delta)
}

export const REDIRECT_ACTION_TYPE = ActionTypes.REPLACE
export const GOTO_ACTION_TYPE = ActionTypes.PUSH

export function goBack() {
	return Actions.go(-1)
}

export function goBackTwoPages() {
	return Actions.go(-2)
}

export function goForward() {
	return Actions.go(1)
}

export function pushLocation(location, options) {
	setInContext('Navigation/SkipLoad', true)
	return goto(location, options)
}

export function replaceLocation(location) {
	setInContext('Navigation/SkipLoad', true)
	return redirect(location)
}

export function initializeRouterAction() {
	return Actions.init()
}

export const UPDATE_MATCH = FoundActionTypes.UPDATE_MATCH
export const RESOLVE_MATCH = FoundActionTypes.RESOLVE_MATCH

export const _RESOLVE_MATCH = '@@react-pages/RESOLVE_MATCH'

export const UNLISTEN_BROWSER_HISTORY_EVENTS = ActionTypes.DISPOSE