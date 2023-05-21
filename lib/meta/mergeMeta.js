import BASE_META from './baseMeta.js'

import dropUndefinedProperties from './dropUndefinedProperties.js'

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
	// // `Object.assign` is not supported in Internet Explorer.
	// let meta = Object.assign({}, BASE_META, ...)

	let meta = { ...BASE_META }

	if (rootMeta) {
		rootMetaData = dropUndefinedProperties(rootMeta({
			useSelector,
			props: stash.getRootComponentProps() || {}
		}))
	}

	stash.setRootComponentMeta(rootMetaData)
	meta = {
		...meta,
		...rootMetaData
	}

	if (pageMeta) {
		pageMetaData = dropUndefinedProperties(pageMeta({
			useSelector,
			props: stash.getPageComponentProps() || {}
		}))
	}

	stash.setPageComponentMeta(pageMetaData)
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
