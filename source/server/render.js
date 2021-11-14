import React from 'react'
import createStringStream from 'string-to-stream'
import MultiStream from 'multistream'

import { renderBeforeContent, renderAfterContent } from './html'
import normalizeSettings from '../redux/normalize'
import timer from '../timer'
import { getLocationUrl, parseLocation } from '../location'
import reduxRender from '../redux/server/render'
import { initialize as reduxInitialize } from '../redux/server/server'
import { generateMetaTagsMarkup, mergeMeta, convertOpenGraphLocaleToLanguageTag, dropUndefinedProperties } from '../meta/meta'
import { createRenderingStream } from './reactRender'

export default async function(settings, {
	assets,
	proxy,
	url,
	renderContent,
	html = {},
	cookies,
	locales,
	headers,
	getInitialState
}) {
	settings = normalizeSettings(settings)

	const {
		routes,
		container,
		meta: _defaultMeta,
		authentication,
		onError,
		codeSplit
	} = settings

	const defaultMeta = dropUndefinedProperties(_defaultMeta)

	const location = parseLocation(url)
	const path = location.pathname.replace(/\/$/, '')

	// A special `base.html` page for static sites.
	// (e.g. the ones hosted on Amazon S3)
	let serverSideRender = true
	if (path === '/react-pages-base') {
		serverSideRender = false
	}

	// If Redux is being used, then render for Redux.
	// Else render for pure React.
	const render = reduxRender

	// `parameters` are used for `assets` and `html` modifiers.
	const {
		cookies: newCookies,
		generateJavascript,
		...parameters
	} = await reduxInitialize(settings, {
		proxy,
		cookies,
		headers,
		locales,
		url,
		getInitialState
	})

	function generateOuterHtml(meta) {
		// `html` modifiers
		let { head, bodyStart, bodyEnd } = html

		// Normalize `html` parameters
		head = typeof head === 'function' ? head(path, parameters) : head
		bodyStart = typeof bodyStart === 'function' ? bodyStart(path, parameters) : bodyStart
		bodyEnd = typeof bodyEnd === 'function' ? bodyEnd(path, parameters) : bodyEnd

		// Normalize assets
		assets = typeof assets === 'function' ? assets(path, parameters) : assets

		if (!assets.entries) {
			// Default `assets.entries` to `["main"]`.
			if (assets.javascript && assets.javascript.main) {
				assets.entries = ['main']
			} else {
				throw new Error(`"assets.entries[]" configuration parameter is required: it includes all Webpack "entries" for which javascripts and styles must be included on a server-rendered page. If you didn't set up any custom "entries" in Webpack configuration then the default Webpack entry is called "main". You don't seem to have the "main" entry so the server doesn't know which assets to include on the page ("['main']" is the default value for "assets.entries").`)
			}
		}

		// Render all HTML that goes before React markup.
		const beforeContent = renderBeforeContent({
			assets,
			locale: meta.locale && convertOpenGraphLocaleToLanguageTag(meta.locale),
			meta: generateMetaTagsMarkup(meta).join(''),
			head,
			bodyStart
		})

		// Render all HTML that goes after React markup
		const afterContent = renderAfterContent({
			javascript: generateJavascript(),
			assets,
			locales,
			bodyEnd,
			serverSideRender,
			contentNotRendered: renderContent === false
		})

		return [ beforeContent, afterContent ]
	}

	// A special `base.html` page for static sites.
	// (e.g. the ones hosted on Amazon S3)
	if (!serverSideRender) {
		// Get `<meta/>` for the route.
		const [ beforeContent, afterContent ] = generateOuterHtml({
			...defaultMeta,
			...mergeMeta([])
		})
		return {
			route: '/react-pages-base',
			status: 200,
			content: createStringStream(beforeContent + afterContent),
			cookies: []
		}
	}

	// Render the page.
	const {
		redirect,
		route,
		status,
		content,
		meta,
		containerProps,
		time
	} = await render({
		...parameters,
		// routes,
		codeSplit,
		defaultMeta
	})

	if (redirect) {
		return {
			// Stringify `redirect` location.
			// Prepend `basename` to relative URLs for server-side redirect.
			redirect: getLocationUrl(redirect, { basename: settings.basename })
		}
	}

	const [ beforeContent, afterContent ] = generateOuterHtml(meta)

	const streams = [
		createStringStream(beforeContent),
		createStringStream(afterContent)
	]

	if (renderContent !== false) {
		// Render page content to a `Stream`
		// inserting this stream in the middle of `streams` array.
		// `array.splice(index, 0, element)` inserts `element` at `index`.
		const pageElement = React.createElement(container, containerProps, content)
		streams.splice(streams.length / 2, 0, createRenderingStream(pageElement))
	}

	return {
		route,
		status,
		content: new MultiStream(streams),
		time,
		cookies: newCookies
	}
}