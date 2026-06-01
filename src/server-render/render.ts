import { createElement } from 'react'

// https://react.dev/reference/react-dom/server
// "Server APIs for Web Streams"
// "Node.js also includes these methods for compatibility, but they are not
// recommended due to worse performance. Use the dedicated Node.js APIs instead."
import { renderToPipeableStream } from 'react-dom/server'

import Stream from 'node:stream'

import { ServerSideRenderEnvironment } from 'navigation-stack'

import type { Routes } from '../types.d.js'
import type { OnBeforeLocationChange } from '../react-components/onLocationChange.js'

import WithNavigationStack from '../react-components/WithNavigationStack.js'
import RouteRenderer from '../react-components/RouteRenderer.js'

export default function render<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any>,
	Cookies extends Record<string, any>
>(
	routes: Routes<LoadContext, NavigationContext, MetaContext, Props, LocationParameters, Cookies>,
	options: Options
): Promise<Pipable> {
	// Resolve the URL and get the HTTP status code and perhaps <meta/> tags.
	// Both HTTP status code and <meta/> tags can be calculated before any React rendering.
	const statusCode = 200 // This is just a "dummy" value.
	const metaTags = '<meta charset="utf-8"/>' // This is just a "dummy" value.

	// Render the application as a React element.
	const element = createElement(WithNavigationStack, {
		environment: ServerSideRenderEnvironment,
		basePath: options.basePath,
		onBeforeLocationChange: options.onBeforeLocationChange,
		manageScrollPosition: true,
		scrollPositionSetter: undefined,
		children: createElement(RouteRenderer, { routes }),
	})

	// Create an "<html>...</html>" wrapper.
	const htmlElement = createElement(options.Html, { children: element })

	// Return a `Promise`.
	return new Promise((resolve) => {
		// Render the React element to HTML markup (streaming).
		const { pipe, abort } = renderToPipeableStream(htmlElement, {
			// This string will be placed in an inline <script> tag.
			bootstrapScriptContent: 'window.REACT_PAGES_SERVER_RENDER = true',

			// An array of string URLs for the <script> tags to emit on the page.
			// Use this to include the <script> that calls `hydrateRoot()`.
			bootstrapScripts: [options.scriptUrl],

			// A callback that fires whenever there is a server error, whether recoverable or not.
			// By default, this only calls `console.error`. If you override it to log crash reports,
			// make sure that you still call `console.error`. You can also use it to adjust
			// the status code before the shell is emitted.
			onError() {

			},

			// A callback that fires when all rendering is complete, including both the shell
			// and all additional content. You can use this instead of `onShellReady`
			// for crawlers and static generation. If you start streaming here, you won’t get
			// any progressive loading. The stream will contain the final HTML.
			onAllReady() {

			},

			// A callback that fires right after the initial shell has been rendered.
			// You can set the status code and call `pipe` here to start streaming.
			// React will stream the additional content after the shell along with
			// the inline <script> tags that replace the HTML loading fallbacks with the content.
			onShellReady() {
				// `pipe` outputs the HTML into the provided Writable Node.js Stream.
				// Call `pipe` in `onShellReady` if you want to enable streaming,
				// or in `onAllReady` for crawlers and static generation.
				resolve({ pipe })
			}
		})
	})
}

interface Options {
	url: string; // Relative URL.
	basePath?: string;
	onBeforeLocationChange?: OnBeforeLocationChange;
	// A React component that wraps the application's markup in "<html>...</html>" markup.
	Html: React.ElementType;
	scriptUrl: string;
}

interface Pipable {
	pipe(stream: Stream): void;
}