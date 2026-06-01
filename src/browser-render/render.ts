import { createElement } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

import { WebBrowserEnvironment } from 'navigation-stack'

import type { Routes, CommonOptions, OnBeforeLocationChange } from '../types.d.js'

import WithNavigationStack from '../react-components/WithNavigationStack.js'
import RouteRenderer, { type RouteRendererProps } from '../react-components/RouteRenderer.js'

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
): void {
	// Render the application as a React element.
	const element = createElement(WithNavigationStack, {
		environment: WebBrowserEnvironment,
		basePath: options.basePath,
		onBeforeLocationChange: options.onBeforeLocationChange,
		manageScrollPosition: true,
		scrollPositionSetter: undefined,
		children: createElement<
			RouteRendererProps<
				LoadContext,
				NavigationContext,
				MetaContext,
				Props,
				LocationParameters,
				Cookies
			>
		>(RouteRenderer, { routes }),
	})

	// If the application was rendered on server side
	// then it should be "hydrated" on client side
	// rather than be re-rendered from scratch.
	//
	// During server-side render, it adds a special marker:
	// <script> window.REACT_PAGES_SERVER_RENDER = true </script>.
	// This way, on client side, it automatically knows
	// if it should "hydrate" or render from scratch.
	//
	if (window.REACT_PAGES_SERVER_RENDER) {
		// This flag will no longer be used.
		delete window.REACT_PAGES_SERVER_RENDER
		if (isServerSideRenderOptions(options)) {
			// Create an "<html>...</html>" wrapper.
			const htmlElement = createElement(options.Html, { children: element })
			// "Hydrate" the "<html>...</html>" wrapper.
			hydrateRoot(document, htmlElement)
		} else {
			throw new Error(HTML_COMPONENT_NOT_PASSED_ERROR)
		}
	} else {
		if (isServerSideRenderOptions(options)) {
			throw new Error('`window.REACT_PAGES_SERVER_RENDER` flag not found')
		}
		// Render the React element inside the given HTML DOM element.
		createRoot(options.to).render(element)
	}
}

function isServerSideRenderOptions(options: Options): options is OptionsServerSideRender {
	return Boolean((options as OptionsServerSideRender).Html)
}

interface OptionsClientSideRender extends CommonOptions {
	to: HTMLElement;
}

interface OptionsServerSideRender extends CommonOptions {
	Html: React.ElementType;
}

type Options = OptionsClientSideRender | OptionsServerSideRender

const HTML_COMPONENT_NOT_PASSED_ERROR = 'When using server-side rendering, you must pass the same `Html` component as an option both to server-side `render()` and client-side `render()`'