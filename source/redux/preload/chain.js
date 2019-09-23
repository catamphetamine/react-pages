import { isServerSidePreloaded } from '../../client/flags'

// Returns function returning a Promise
// which resolves when all the required page `load`s are resolved.
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
	params,
	getCookie,
	preloading
)
{
	// Set `.preload({ ... })` function arguments,
	// and also set default `load` options.
	setUpPreloaders(
		preloaders,
		{
			dispatch,
			getState,
			location,
			params,
			server,
			// `getCookie` `load` parameter has been requested:
			// https://github.com/catamphetamine/react-website/issues/71
			getCookie
		},
		server
	)

	// Only select those `load`s which
	// should be run in current circumstances.
	preloaders = filter_preloaders(preloaders, server, isInitialClientSidePreload)

	// Construct a sequential chain out of preloaders.
	// Because each of them could be either parallel or sequential.
	const chain = chain_preloaders(preloaders)

	// If there are no `load`s for this route, then exit.
	if (chain.length === 0) {
		return
	}

	// Return a function which generates preloading `Promise` chain.
	return () => promisify(chain, preloading)
}

// Applies default `load` options
// and sets `load` function arguments.
function setUpPreloaders(preloaders, preload_arguments, server)
{
	for (const component_preloaders of preloaders) {
		for (const preloader of component_preloaders) {
			setUpPreloader(preloader, preload_arguments, server)
		}
	}
}

// Applies default `load` options
// and sets `load` function arguments.
function setUpPreloader(preloader, preload_arguments, server)
{
	const preload = preloader.preload
	preloader.preload = () => preload(preload_arguments)

	// If Server-Side Rendering is not being used at all
	// then all `load`s must be marked as client-side ones.
	if (!server && !isServerSidePreloaded()) {
		preloader.options.client = true
	}
}

// Selects only those `load`s which
// should be run in current circumstances.
export function filter_preloaders(preloaders, server, isInitialClientSidePreload)
{
	// `preloaders` array will be mutated
	preloaders = preloaders.slice()

	preloaders.forEach((_, i) =>
	{
		preloaders[i] = preloaders[i].filter((preloader) =>
		{
			// Don't execute client-side-only `load`s on server side
			if (preloader.options.client && server) {
				return false
			}
			// Don't execute server-side-only `load`s on client side
			if (preloader.options.server && !server) {
				return false
			}
			// If it's initial client side preload (after the page has been loaded),
			// then only execute those `load`s marked as "client-side-only".
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
// `load`s for a particular React component.
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
	// `load`s for a particular React component.
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
	// A list of same component's `load`s
	if (Array.isArray(preloader)) {
		return chain_preloaders(preloader)
	}

	// Same component adjacent `load`
	return preloader.preload
}

function is_preloader_blocking(preloader)
{
	// A list of same component's `load`s
	if (Array.isArray(preloader))
	{
		// Determine the proper `blocking` option
		// for this component's `load`s.
		for (const sibling_preloader of preloader)
		{
			// If any of component's `load`s are `blocking: true`
			// then all of them are `blocking: true`.
			if (sibling_preloader.options.blocking)
			{
				return true
			}
		}

		return false
	}

	// Same component adjacent `load`
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