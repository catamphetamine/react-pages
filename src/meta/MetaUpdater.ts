// import { isEqual } from 'lodash-es'
import isEqual from 'lodash/isEqual.js'

import mergeMeta from './mergeMeta.js'
import applyMeta from './applyMeta.js'
import dropUndefinedProperties from './dropUndefinedProperties.js'
import { getFromContext } from '../context/context.js'

import type PageRouteData from '../data/PageRouteData.js'

import type { PageMetaFunction } from '../../types.d.js'

export default function MetaUpdater({
	meta,
	pageRouteData,
	routeSegmentPosition,
	props,
	customProps
}: Props) {
	// `meta()` function uses `useSelector()` hook,

	// Calculate `newMeta` even if `InitialMetaHasBeenApplied` flag is `false`,
	// so that it calls the `useSelector()` hook which will trigger a rerender later
	// when the value returned by that `useSelector()` hook changes.
	let newMeta = meta({
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
		switch (routeSegmentPosition) {
			case 'root':
				prevMeta = pageRouteData.getRootRouteComponentMeta()
				break
			case 'leaf':
				prevMeta = pageRouteData.getPageRouteComponentMeta()
				break
			default:
				throw new Error(`[react-pages] Unsupported route segment position: "${routeSegmentPosition}"`)
		}

		if (!isEqual(prevMeta, newMeta)) {
			switch (routeSegmentPosition) {
				case 'root':
					applyMeta(mergeMeta({
						rootMetaData: newMeta,
						pageMetaData: pageRouteData.getPageRouteComponentMeta(),
						pageRouteData
					}))
					console.log('[react-pages] Root <meta/> updated')
					break
				case 'leaf':
					applyMeta(mergeMeta({
						rootMetaData: pageRouteData.getRootRouteComponentMeta(),
						pageMetaData: newMeta,
						pageRouteData
					}))
					console.log('[react-pages] Page <meta/> updated')
					break
				default:
					throw new Error(`[react-pages] Unsupported route segment position: "${routeSegmentPosition}"`)
			}
		}
	}

	return null
}

interface Props {
	meta: PageMetaFunction;
	pageRouteData: PageRouteData;
	routeSegmentPosition?: 'root' | 'leaf';
	props?: object;
	customProps?: object;
}