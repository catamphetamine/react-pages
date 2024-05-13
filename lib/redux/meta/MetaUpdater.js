import React from 'react'
// import PropTypes from 'prop-types'

import { useSelector } from 'react-redux'

// import { isEqual } from 'lodash-es'
import isEqual from 'lodash/isEqual.js'

import { usePageStateSelectorWithCustomUseSelector } from '../usePageStateSelector.js'

import mergeMeta from '../../meta/mergeMeta.js'
import applyMeta from '../../meta/applyMeta.js'
import dropUndefinedProperties from '../../meta/dropUndefinedProperties.js'
import { getFromContext } from '../../context.js'

export default function MetaUpdater({
	meta,
	stash,
	routePosition,
	props,
	customProps
}) {
	// `meta()` function uses `useSelector()` hook,

	// Calculate `newMeta` even if `InitialMetaHasBeenApplied` flag is `false`,
	// so that it calls the `useSelector()` hook which will trigger a rerender later
	// when the value returned by that `useSelector()` hook changes.
	let newMeta = meta({
		useSelector: getter => useSelector(getter),
		usePageStateSelector: (reducerName, getter) => usePageStateSelectorWithCustomUseSelector(reducerName, getter, useSelector),
		props: {
			...props,
			...customProps
		}
	})

	if (newMeta) {
		newMeta = dropUndefinedProperties(newMeta)
	}

	if (getFromContext('App/InitialMetaHasBeenApplied')) {
		let prevMeta
		switch (routePosition) {
			case 'root':
				prevMeta = stash.getRootRouteComponentMeta()
				break
			case 'leaf':
				prevMeta = stash.getPageRouteComponentMeta()
				break
			default:
				throw new Error(`[react-pages] Unsupported route position: "${routePosition}"`)
		}

		if (!isEqual(prevMeta, newMeta)) {
			switch (routePosition) {
				case 'root':
					applyMeta(mergeMeta({
						rootMetaData: newMeta,
						pageMetaData: stash.getPageRouteComponentMeta(),
						stash
					}))
					console.log('[react-pages] Root <meta/> updated')
					break
				case 'leaf':
					applyMeta(mergeMeta({
						rootMetaData: stash.getRootRouteComponentMeta(),
						pageMetaData: newMeta,
						stash
					}))
					console.log('[react-pages] Page <meta/> updated')
					break
				default:
					throw new Error(`[react-pages] Unsupported route position: "${routePosition}"`)
			}
		}
	}

	return null
}

// MetaUpdater.propTypes = {
// 	meta: PropTypes.func.isRequired,
// 	stash: PropTypes.object.isRequired,
// 	routePosition: PropTypes.oneOf(['root', 'leaf']).isRequired,
// 	props: PropTypes.object,
// 	customProps: PropTypes.object
// }
