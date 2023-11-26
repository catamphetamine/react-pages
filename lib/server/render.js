import React from 'react'
import createStringStream from 'string-to-stream'
import MultiStream from 'multistream'

import { renderBeforeContent, renderAfterContent } from './html.js'
import normalizeSettings from '../redux/normalize.js'
import timer from '../timer.js'
import parseLocationUrl from '../parseLocationUrl.js'
import getLocationUrl from '../getLocationUrl.js'
import reduxRender from '../redux/server/render.js'
import { initialize as reduxInitialize } from '../redux/server/server.js'
import mergeMeta from '../meta/mergeMeta.js'
import getMetaTagsMarkup from '../meta/getMetaTagsMarkup.js'
import convertOpenGraphLocaleToLanguageTag from '../meta/convertOpenGraphLocaleToLanguageTag.js'
import { createRenderingStream } from './reactRender.js'

export default async function(settings, {
	assets,
	proxy,
	url,
	origin,
	renderContent,
	html = {},
	cookies,
	locales,
	headers,
	getLoadContext,
	getInitialState
}) {
	settings = normalizeSettings(settings)

	const {
		routes,
		rootComponent,
		codeSplit
	} = settings

	// `url` is obtained from Node.js `request.url` property,
	// which is always a relative URL.
	// https://nodejs.org/api/http.html#messageurl
	const location = parseLocationUrl(url)
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
		origin,
		location,
		getLoadContext,
		getInitialState
	})

	// Normalize assets type and shape.
	assets = typeof assets === 'function' ? assets(path, parameters) : assets
	if (!assets.entries) {
		// Default `assets.entries` to `["main"]`.
		if (assets.javascript && assets.javascript.main) {
			assets.entries = ['main']
		} else {
			throw new Error(`"assets.entries[]" configuration parameter is required: it includes all Webpack "entries" for which javascripts and styles must be included on a server-rendered page. If you didn't set up any custom "entries" in Webpack configuration then the default Webpack entry is called "main". You don't seem to have the "main" entry so the server doesn't know which assets to include on the page ("['main']" is the default value for "assets.entries").`)
		}
	}

	function generateOuterHtmlBeforeContent({ meta }) {
		// `html` modifiers
		let { head, bodyStart } = html

		// Normalize `html` parameters
		head = typeof head === 'function' ? head(path, parameters) : head
		bodyStart = typeof bodyStart === 'function' ? bodyStart(path, parameters) : bodyStart

		// Render all HTML that goes before React markup.
		return renderBeforeContent({
			assets,
			locale: meta.locale && convertOpenGraphLocaleToLanguageTag(meta.locale),
			meta: getMetaTagsMarkup(meta).join(''),
			head,
			bodyStart
		})
	}

	function generateOuterHtmlAfterContent() {
		// `html` modifiers
		let { bodyEnd } = html

		// Normalize `html` parameters
		bodyEnd = typeof bodyEnd === 'function' ? bodyEnd(path, parameters) : bodyEnd

		// Render all HTML that goes after React markup
		return renderAfterContent({
			javascript: generateJavascript(),
			assets,
			locales,
			bodyEnd,
			serverSideRender,
			contentNotRendered: renderContent === false
		})
	}

	// A special `base.html` page for static sites.
	// (e.g. the ones hosted on Amazon S3)
	if (!serverSideRender) {
		// Get `<meta/>` tags for `/react-pages-base` route.
		const meta = mergeMeta({
			pageMeta: undefined,
			rootMeta: codeSplit ? routes[0].meta : routes[0].Component.meta,
			useSelector: (getter) => getter(parameters.store.getState()),
			stash: parameters.stash
		})
		const beforeContent = generateOuterHtmlBeforeContent({ meta })
		const afterContent = generateOuterHtmlAfterContent()
		return {
			route: '/react-pages-base',
			status: 200,
			content: createStringStream(beforeContent + afterContent),
			cookies: []
		}
	}

	// Render page content to a `React.Element`.
	const {
		redirect,
		route,
		status,
		content,
		meta,
		rootComponentProps,
		time
	} = await render({
		...parameters,
		// routes,
		codeSplit
	})

	if (redirect) {
		// Prepend `basename` to relative URLs for server-side redirect.
		return {
			redirect: {
				...redirect,
				url: prependBasenameToUrl(redirect.url, settings.basename)
			}
		}
	}

	const beforeContent = generateOuterHtmlBeforeContent({ meta })

	const streams = [
		createStringStream(beforeContent)
	]

	if (renderContent !== false) {
		// Render page content to a `Stream`
		// inserting this stream in the middle of `streams` array.
		// `array.splice(index, 0, element)` inserts `element` at `index`.
		const pageElement = React.createElement(rootComponent, rootComponentProps, content)
		streams.push(createRenderingStream(pageElement))
	}

	// Generating `afterContent` should wait for the React 18 rendering process
	// to finish: that's because there can be "Suspense" calls that might fetch data
	// and, therefore, modify Redux state.
	const afterContent = generateOuterHtmlAfterContent()
	streams.push(createStringStream(afterContent))

	return {
		route,
		status,
		content: new MultiStream(streams),
		time,
		cookies: newCookies
	}
}

function prependBasenameToUrl(url, basename) {
	if (typeof url === 'string') {
		return (basename || '') + url
	}
	return getLocationUrl(url, { basename })
}