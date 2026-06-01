import type * as React from 'react'

import type { Location } from 'navigation-stack'

// A route segment could have a `component` property,
// in which case the `component` will be rendered
// and it will wrap any components of any child route segments.
//
interface RouteSegment<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any> = Record<string, any>,
	Cookies extends Record<string, any> = Record<string, any>
> {
	// A route segment doesn't always have a `path` property.
	//
	// Specifically, a route segment only has a `path` property when it appends anything
	// to the parent route segment's `path`.
	// Example: `{ component: Wrapper, children: { path: '/', component: Home } }`.
	//
	// The only restriction is that a "leaf" route segment has to have a `path` in order to be discernable
	// from the rest of the "leaf" route segments.
	//
	path?: string;

	// The component to be rendered (optional).
	//
	// If `component` is a function, it is assumed to be an "asynchronous" `import()` call.
	// This technique is sometimes used to reduce the application bundle size.
	//
	component?: React.ElementType | (() => Promise<React.ElementType>);

	// This function is only used when `component` property is an "asynchronous" `import()` function.
	//
	// This function works same way as `Component.meta` property.
	//
	// Because `component()` function returns the component after a delay,
	// the corresponding `Component.meta` has to be known in advance in order to
	// return the correct `<head/>` markup immediately.
	//
	meta?: PageMetaFunction<Props, MetaContext>;

	// This function is only used when `component` property is an "asynchronous" `import()` function.
	//
	// This function works same way as `Component.load` property.
	//
	// Because `component()` function returns the component after a delay,
	// the corresponding `Component.load` has to be known in advance in order to
	// return the correct `<head/>` markup immediately.
	//
	load?: PageLoadFunction<LoadContext, NavigationContext, Props, LocationParameters, Cookies>;

	// Child route segments.
	//
	// A route segment could be either a "leaf" or a non-"leaf" one.
	//
	// A "leaf" route segment by definition doesn't have any Child route segments.
	//
	// A non-"leaf" route segment could be one of three types:
	// * With neither `component` nor `component()` getter — Just a "passthrough", typically with an added `path`.
	// * With `component` — Renders a wrapper component.
	// * With `component()` getter — Renders a wrapper component that is `import`ed in real time.
	//
	children?: Array<
		RouteSegment<
			LoadContext,
			NavigationContext,
			MetaContext,
			Props,
			LocationParameters,
			Cookies
		>
	>;
}

export type Routes<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any> = Record<string, any>,
	Cookies extends Record<string, any> = Record<string, any>
>	= RouteSegment<
	LoadContext,
	NavigationContext,
	MetaContext,
	Props,
	LocationParameters,
	Cookies
>[]

// `<meta/>` tag attribute value.
export type MetaAttributeValue = string | number | boolean

// `<meta/>` tags that get added on a page.
export interface Meta {
	// Objects are expanded: `{ a: { b: 'c' } }` becomes `<meta property="a:b" content="c"/>`.
	// Arrays of values are expanded: `[{ a: 'b' }, { a: 'c' }]` becomes `<meta property="a" content="b"/>` and `<meta property="a" content="c"/>`.
	// Arrays of objects are expanded: `[{ a: { b: 'c' } }, { a: { b: 'd' } }]` becomes `<meta property="a:b" content="c"/>` and `<meta property="a:b" content="d"/>`.
	[key: string]: MetaAttributeValue | MetaAttributeValue[] | Meta | Meta[];
}

// A function that returns the `<meta/>` tags that should be added on a page.
export type PageMetaFunction<
	Props extends Record<string, any>,
	MetaContext
> = (
	parameters: {
		props: Props,
		context: MetaContext
	}
) => Meta

// A function that returns the `props` that should be passed to the page component.
// Or, it could redirect to some other page.
export type PageLoadFunction<
	LoadContext,
	NavigationContext,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any> = Record<string, any>,
	Cookies extends Record<string, any> = Record<string, any>
> = (
	parameters: {
		context: LoadContext,
		navigationContext: NavigationContext,
		location: Location,
		locationParameters: LocationParameters,
		server: boolean,
		getCookies: () => Cookies
	}
) => Promise<{
	props?: Props,
	redirect?: {
		url: string
	}
} | void>

export interface CommonOptions {
	basePath?: string;
	onBeforeLocationChange?: OnBeforeLocationChange;
}

export type OnBeforeLocationChange = (location: Location, options: {
	redirect: (toLocation: Location) => void
}) => unknown

// At the top of your file, right after your imports
declare global {
  interface Window {
    REACT_PAGES_SERVER_RENDER?: 'true';
  }
}
