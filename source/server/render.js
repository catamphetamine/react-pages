import React from 'react'
import ReactDOM from 'react-dom/server'
import createStringStream from 'string-to-stream'
import combineStreams from 'multistream'

import { renderBeforeContent, renderAfterContent } from './html'
import normalizeSettings from '../redux/normalize'
import timer from '../timer'
import { getLocationUrl, parseLocation } from '../location'
import reduxRender from '../redux/server/render'
import { initialize as reduxInitialize } from '../redux/server/server'
import { generateMetaTagsMarkup } from '../meta/meta'

export default async function(settings, {
	initialize,
	assets,
	proxy,
	url,
	renderContent,
	html = {},
	cookies,
	locales
})
{
	settings = normalizeSettings(settings)

	const {
		routes,
		container,
		authentication,
		onError,
		codeSplit
	} = settings

	// If Redux is being used, then render for Redux.
	// Else render for pure React.
	const render = reduxRender

	const initializeTimer = timer()

	// `parameters` are used for `assets` and `html` modifiers.
	// , afterwards
	const {
		cookies: cookiesToSet,
		generateJavascript,
		...parameters
	} = await reduxInitialize(settings, {
		proxy,
		cookies,
		initialize,
		url
	})

	const location = parseLocation(url)
	const path = location.pathname

	// The above code (server-side `initialize()` method call) is not included
	// in this `try/catch` block because:
	//
	//  * `parameters` are used inside `.error()`
	//
	//  * even if an error was caught inside `initialize()`
	//    and a redirection was performed, say, to an `/error` page
	//    then it would fail again because `initialize()` would get called again,
	//    so wrapping `initialize()` with `try/catch` wouldn't help anyway.
	//
	try {
		const initializeTime = initializeTimer()

		// Internationalization

		function generateOuterHtml(meta)
		{
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
			const beforeContent = renderBeforeContent
			({
				assets,
				meta: generateMetaTagsMarkup(meta).join(''),
				head,
				bodyStart
			})

			// Render all HTML that goes after React markup
			const afterContent = renderAfterContent
			({
				javascript: generateJavascript(),
				assets,
				locales,
				bodyEnd,
				contentNotRendered: renderContent === false
			})

			return [ beforeContent, afterContent ]
		}

		// A special `base.html` page for static sites.
		// (e.g. the ones hosted on Amazon S3)
		if (path.replace(/\/$/, '') === '/react-website-base')
		{
			renderContent = false

			const [ beforeContent, afterContent ] = generateOuterHtml({})

			return {
				route: '/react-website-base',
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
			routes,
			codeSplit
		})

		if (redirect) {
			return {
				redirect: normalizeRedirect(redirect, settings.basename)
			}
		}

		const [ beforeContent, afterContent ] = generateOuterHtml(meta)

		const streams =
		[
			createStringStream(beforeContent),
			createStringStream(afterContent)
		]

		if (renderContent !== false)
		{
			// Render page content to a `Stream`
			// inserting this stream in the middle of `streams` array.
			// `array.splice(index, 0, element)` inserts `element` at `index`.
			const pageElement = React.createElement(container, containerProps, content)
			streams.splice(streams.length / 2, 0, ReactDOM.renderToNodeStream(pageElement))
		}

		return {
			route,
			status,
			content: combineStreams(streams),
			time: {
				...time,
				initialize: initializeTime
			},
			cookies: cookiesToSet
		}
	}
	catch (error)
	{
		if (onError)
		{
			let redirect

			const onErrorParameters = {
				server : true,
				path,
				url : getLocationUrl(location),
				redirect : (to) => {
					// Only the first redirect takes effect on the server side
					if (!redirect) {
						redirect = parseLocation(to)
					}
				},
				// Special case for Redux
				getState : parameters.store.getState
			}

			onError(error, onErrorParameters)

			// Either redirects or throws the error.
			if (redirect) {
				return {
					redirect: normalizeRedirect(redirect, settings.basename)
				}
			}
		}

		throw error
	}
}

function normalizeRedirect(redirect, basename) {
	// Stringify `redirect` location.
	// Prepend `basename` to relative URLs for server-side redirect.
	return getLocationUrl(redirect, { basename })
}