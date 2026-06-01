import { isEqual } from 'es-toolkit'

import mergeMeta from './mergeMeta.js'
import applyMeta from './applyMeta.js'
import dropUndefinedProperties from './dropUndefinedProperties.js'
import { getFromContext } from '../context/context.js'

import type PageRouteData from '../data/PageRouteData.js'

import type { PageMetaFunction } from '../types.d.js'

export default function MetaUpdater({
	meta,
	pageRouteData,
	routeSegmentPosition,
	props,
	customProps
}: Props) {
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