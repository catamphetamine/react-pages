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

import { setInstantBackAbilityFlagForThisNavigation } from '../redux/client/instantNavigation.js'

import { setInContext } from '../context.js'

export function setNavigationContext(context) {
	if (context !== undefined) {
		if (typeof window === 'undefined') {
			throw new Error('Navigation context parameter is only supported on client side')
		}
		setInContext('Navigation/Context', context)
	}
}

function setNavigationLoadFlag(load) {
	if (load === false) {
		setInContext('Navigation/SkipLoad', true)
	}
}

export function redirect(location, { load, context } = {}) {
	setNavigationLoadFlag(load)
	setNavigationContext(context)
	return Actions.replace(location)
}

export function goto(location, { load, context, instantBack } = {}) {
	setNavigationLoadFlag(load)
	setNavigationContext(context)
	setInstantBackAbilityFlagForThisNavigation(instantBack)
	return Actions.push(location)
}

export function navigateThroughHistory(delta, { load } = {}) {
	setNavigationLoadFlag(load)
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
	setNavigationLoadFlag(false)
	return goto(location, options)
}

export function replaceLocation(location) {
	setNavigationLoadFlag(false)
	return redirect(location)
}

export function initializeRouterAction() {
	return Actions.init()
}

export const UPDATE_MATCH = FoundActionTypes.UPDATE_MATCH
export const RESOLVE_MATCH = FoundActionTypes.RESOLVE_MATCH

export const _RESOLVE_MATCH = '@@react-pages/RESOLVE_MATCH'

export const UNLISTEN_BROWSER_HISTORY_EVENTS = ActionTypes.DISPOSE