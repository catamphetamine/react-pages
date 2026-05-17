import type * as React from 'react';

// A route segment could have a `component` property,
// in which case the `component` will be rendered
// and it will wrap any components of any child route segments.
interface RouteSegmentComponentPropertyShape {
	component: React.FC;
}

// A route segment could have a `getComponent()` property,
// in which case the returned component will be rendered
// and it will wrap any components of any child route segments.
interface RouteSegmentGetComponentPropertyShape<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any> = Record<string, any>,
	Cookies extends Record<string, any> = Record<string, any>
> {
	// This function works same way as `component` property.
	//
	// It returns the `component` after a delay.
	// For example, it could use an "asynchronous" `import()` function
	// to reduce the main bundle size.
	//
	getComponent: () => Promise<React.FC>;

	// This function works same way as `Component.meta` property.
	//
	// Because `getComponent()` function returns the component after a delay,
	// the corresponding `Component.meta` has to be known in advance in order to
	// return the correct `<head/>` markup immediately.
	//
	meta?: PageMetaFunction<Props, MetaContext>;

	// This function works same way as `Component.load` property.
	//
	// Because `getComponent()` function returns the component after a delay,
	// the corresponding `Component.load` has to be known in advance in order to
	// return the correct `<head/>` markup immediately.
	//
	load?: PageLoadFunction<LoadContext, NavigationContext, Props, LocationParameters, Cookies>;
}

interface LeafRouteSegmentWithoutComponent_ {
	// A "leaf" route segment has to have a `path` in order to be discernable
	// from the rest of the "leaf" route segments.
	path: string;

	// A "leaf" route segment by definition doesn't have any Child route segments.
	children: undefined;
}

interface LeafRouteSegmentWithComponent_ extends LeafRouteSegmentWithoutComponent_, RouteSegmentComponentPropertyShape {}

interface LeafRouteSegmentWithGetComponent_<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any> = Record<string, any>,
	Cookies extends Record<string, any> = Record<string, any>
> extends LeafRouteSegmentWithoutComponent_, RouteSegmentGetComponentPropertyShape<
	LoadContext,
	NavigationContext,
	MetaContext,
	Props,
	LocationParameters,
	Cookies
> {}

type LeafRouteSegment<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any> = Record<string, any>,
	Cookies extends Record<string, any> = Record<string, any>
> =
	| LeafRouteSegmentWithComponent_
	| LeafRouteSegmentWithGetComponent_<
		LoadContext,
		NavigationContext,
		MetaContext,
		Props,
		LocationParameters,
		Cookies
	>

// A non-"leaf" route segment could be one of three types:
// * With neither `component` nor `getComponent` — Just a "passthrough", typically with an added `path`.
// * With `component` — Renders a wrapper component.
// * With `getComponent` — Renders a wrapper component that is `import`ed in real time.
interface NonLeafRouteSegment<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any> = Record<string, any>,
	Cookies extends Record<string, any> = Record<string, any>
> extends Partial<
	RouteSegmentComponentPropertyShape
>, Partial<
	RouteSegmentGetComponentPropertyShape<
		LoadContext,
		NavigationContext,
		MetaContext,
		Props,
		LocationParameters,
		Cookies
	>
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

	// Because this is a non-"leaf" route segment, `children` are required.
	children: Array<
		NonLeafRouteSegment<
			LoadContext,
			NavigationContext,
			MetaContext,
			Props,
			LocationParameters,
			Cookies
		> | LeafRouteSegment<
			LoadContext,
			NavigationContext,
			MetaContext,
			Props,
			LocationParameters,
			Cookies
		>
	>;
}

// A route segment could be either a "leaf" or a non-"leaf" one.
export type RouteSegment<
	LoadContext,
	NavigationContext,
	MetaContext extends Record<string, any>,
	Props extends Record<string, any>,
	LocationParameters extends Record<string, any> = Record<string, any>,
	Cookies extends Record<string, any> = Record<string, any>
> =
	| NonLeafRouteSegment<
		LoadContext,
		NavigationContext,
		MetaContext,
		Props,
		LocationParameters,
		Cookies
	>
	| LeafRouteSegment<
		LoadContext,
		NavigationContext,
		MetaContext,
		Props,
		LocationParameters,
		Cookies
	>

// `<meta/>` tag attribute value.
type MetaAttributeValue = string | number | boolean;

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
) => Meta;

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
} | void>;
