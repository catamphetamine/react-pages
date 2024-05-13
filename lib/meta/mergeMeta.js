import BASE_META from './baseMeta.js'

import dropUndefinedProperties from './dropUndefinedProperties.js'

import { usePageStateSelectorWithCustomUseSelector } from '../redux/usePageStateSelector.js'

/**
 * Gathers `<title/>` and `<meta/>` tags (inside `<head/>`)
 * defined for this route (`components` array).
 * @param {object[]} meta — An array of meta objects.
 * @return {object}
 */
export default function mergeMeta({
	pageMeta,
	pageMetaData,
	rootMeta,
	rootMetaData,
	useSelector,
	stash
}) {
	const usePageStateSelector = (reducerName, selectorFromReducerState) => {
		return usePageStateSelectorWithCustomUseSelector(reducerName, selectorFromReducerState, useSelector)
	}

	// // `Object.assign` is not supported in Internet Explorer.
	// let meta = Object.assign({}, BASE_META, ...)

	let meta = { ...BASE_META }

	if (rootMeta) {
		rootMetaData = rootMeta({
			useSelector,
			usePageStateSelector,
			props: stash.getRootRouteComponentProps() || {}
		})
		if (rootMetaData) {
			rootMetaData = dropUndefinedProperties(rootMetaData)
		}
	}

	stash.setRootRouteComponentMeta(rootMetaData)
	meta = {
		...meta,
		...rootMetaData
	}

	if (pageMeta) {
		pageMetaData = pageMeta({
			useSelector,
			usePageStateSelector,
			props: stash.getPageRouteComponentProps() || {}
		})
		if (pageMetaData) {
			pageMetaData = dropUndefinedProperties(pageMetaData)
		}
	}

	stash.setPageRouteComponentMeta(pageMetaData)
	meta = {
		...meta,
		...pageMetaData
	}

	// Remove `locale` from `locales`.
	if (meta.locale && meta.locales) {
		meta.locales = meta.locales.filter(_ => _ !== meta.locale)
		if (meta.locales.length === 0) {
			delete meta.locales
		}
	}

	return meta
}
