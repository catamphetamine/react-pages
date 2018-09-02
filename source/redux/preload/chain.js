// Returns function returning a Promise
// which resolves when all the required preload()s are resolved.
//
// If no preloading is needed, then returns nothing.
//
export default function generatePreloadChain
(
	preloaders,
	server,
	isInitialClientSidePreload,
	getState,
	dispatch,
	location,
	parameters,
	preloading
)
{
	// Set `.preload({ ... })` function arguments,
	// and also set default `@preload()` options.
	setUpPreloaders(
		preloaders,
		{
			dispatch,
			getState,
			location,
			// `parameters` property name is deprecated, use `params` instead.
			parameters,
			params: parameters,
			server
		},
		server
	)

	// Only select those `@preload()`s which
	// should be run in current circumstances.
	preloaders = filter_preloaders(preloaders, server, isInitialClientSidePreload)

	// Construct a sequential chain out of preloaders.
	// Because each of them could be either parallel or sequential.
	const chain = chain_preloaders(preloaders)

	// If there are no `@preload()`s for this route, then exit.
	if (chain.length === 0) {
		return
	}

	// Return a function which generates preloading `Promise` chain.
	return () => promisify(chain, preloading)
}

// Applies default `@preload()` options
// and sets `@preload()` function arguments.
function setUpPreloaders(preloaders, preload_arguments, server)
{
	for (const component_preloaders of preloaders) {
		for (const preloader of component_preloaders) {
			setUpPreloader(preloader, preload_arguments, server)
		}
	}
}

// Applies default `@preload()` options
// and sets `@preload()` function arguments.
function setUpPreloader(preloader, preload_arguments, server)
{
	const preload = preloader.preload
	preloader.preload = () => preload(preload_arguments)

	// If Server-Side Rendering is not being used at all
	// then all `@preload()`s must be marked as client-side ones.
	if (!server && !window._server_side_render) {
		preloader.options.client = true
	}
}

// Selects only those `@preload()`s which
// should be run in current circumstances.
export function filter_preloaders(preloaders, server, isInitialClientSidePreload)
{
	// `preloaders` array will be mutated
	preloaders = preloaders.slice()

	preloaders.forEach((_, i) =>
	{
		preloaders[i] = preloaders[i].filter((preloader) =>
		{
			// Don't execute client-side-only `@preload()`s on server side
			if (preloader.options.client && server) {
				return false
			}
			// Don't execute server-side-only `@preload()`s on client side
			if (preloader.options.server && !server) {
				return false
			}
			// If it's initial client side preload (after the page has been loaded),
			// then only execute those `@preload()`s marked as "client-side-only".
			if (isInitialClientSidePreload && !preloader.options.client) {
				return false
			}
			return true
		})
	})

	return preloaders.filter(component_preloaders => component_preloaders.length > 0)
}

// Constructs `preload` chain.
//
// @param `preloaders` is an array of `component_preloaders`.
// `component_preloaders` is an array of all
// `@preload()`s for a particular React component.
// Therefore `preloaders` is an array of arrays.
export function chain_preloaders(preloaders, chain = [], parallel = [])
{
	// If all `preload`s have been visited
	if (preloaders.length === 0)
	{
		if (parallel.length === 0) {
			return chain
		}
		// Finalize pending parallel `preload`s
		if (parallel.length === 1) {
			return chain.concat(parallel)
		}
		return chain.concat({ parallel })
	}

	// `component_preloaders` is an array of all
	// `@preload()`s for a particular React component.
	const preloader = preloaders[0]
	preloaders = preloaders.slice(1)

	if (!is_preloader_blocking(preloader))
	{
		return chain_preloaders(
			preloaders,
			chain,
			concat(parallel, get_preloader(preloader))
		)
	}

	if (parallel.length === 0)
	{
		return chain_preloaders(
			preloaders,
			concat(chain, get_preloader(preloader)),
			[]
		)
	}

	return chain_preloaders(
		preloaders,
		chain.concat({ parallel: concat(parallel, get_preloader(preloader)) }),
		[]
	)
}

function get_preloader(preloader)
{
	// A list of same component's `@preload()`s
	if (Array.isArray(preloader)) {
		return chain_preloaders(preloader)
	}

	// Same component adjacent `@preload()`
	return preloader.preload
}

function is_preloader_blocking(preloader)
{
	// A list of same component's `@preload()`s
	if (Array.isArray(preloader))
	{
		// Determine the proper `blocking` option
		// for this component's `@preload()`s.
		for (const sibling_preloader of preloader)
		{
			// If any of component's `@preload()`s are `blocking: true`
			// then all of them are `blocking: true`.
			if (sibling_preloader.options.blocking)
			{
				return true
			}
		}

		return false
	}

	// Same component adjacent `@preload()`
	return preloader.options.blockingSibling
}

// Returns a `Promise` chain.
function promisify(chain, preloading)
{
	if (typeof chain === 'function') {
		return chain()
	}

	if (typeof chain === 'object' && chain.parallel)
	{
		return Promise.all(chain.parallel.map(link => promisify(link, preloading)))
	}

	return chain.reduce((promise, link) =>
	{
		return promise.then(() =>
		{
			if (preloading.cancelled) {
				return
			}
			return promisify(link, preloading)
		})
	},
	Promise.resolve())
}

function concat(array, part)
{
	if (Array.isArray(part) && part.length > 1) {
		// Pushes an array
		return array.concat([part])
	}
	// Pushes a single element
	return array.concat(part)
}