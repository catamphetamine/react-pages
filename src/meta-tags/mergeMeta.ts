import type { Meta, PageMetaFunction } from '../types.d.js'

import BASE_META from './baseMeta.js'

import dropUndefinedProperties from './dropUndefinedProperties.js'

import type PageRouteData from '../data/PageRouteData.js'

/**
 * Gathers `<meta/>` tags (inside `<head/>`)
 * defined for this route (`components` array).
 * @param {object[]} meta — An array of meta objects.
 * @return {object}
 */
export default function mergeMeta<State>({
	pageMeta,
	pageMetaData,
	rootMeta,
	rootMetaData,
	useSelector,
	pageRouteData
}: Parameters<State>) {
	// // `Object.assign` is not supported in Internet Explorer.
	// let meta = Object.assign({}, BASE_META, ...)

	let meta: Meta = { ...BASE_META }

	if (rootMeta) {
		rootMetaData = rootMeta({
			props: pageRouteData.getRootRouteComponentProps() || {}
		})
		if (rootMetaData) {
			rootMetaData = dropUndefinedProperties(rootMetaData)
		}
	}

	pageRouteData.setRootRouteComponentMeta(rootMetaData)
	meta = {
		...meta,
		...rootMetaData
	}

	if (pageMeta) {
		pageMetaData = pageMeta({
			props: pageRouteData.getPageRouteComponentProps() || {}
		})
		if (pageMetaData) {
			pageMetaData = dropUndefinedProperties(pageMetaData)
		}
	}

	pageRouteData.setPageRouteComponentMeta(pageMetaData)
	meta = {
		...meta,
		...pageMetaData
	}

	// Remove `locale` from `locales`.
	if (meta.locale && meta.locales) {
		if (Array.isArray(meta.locales)) {
			if (isArrayOfStrings(meta.locales)) {
				meta.locales = meta.locales.filter(locale => locale !== meta.locale)
				if (meta.locales.length === 0) {
					delete meta.locales
				}
			} else {
				throw new Error('`meta.locales` can only be an array of strings')
			}
		} else {
			throw new Error('`meta.locales` can only be an array')
		}
	}

	return meta
}

interface Parameters<State> {
	pageMeta?: PageMetaFunction;
	pageMetaData?: Meta;
	rootMeta?: PageMetaFunction;
	rootMetaData?: Meta;
	useSelector?: UseSelector<State>;
	pageRouteData?: PageRouteData;
}

function isArrayOfStrings(value: unknown): value is string[] {
	return Array.isArray(value) && value.every(item => typeof item === 'string')
}