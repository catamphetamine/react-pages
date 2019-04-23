import deep_equal from 'deep-equal'
import getRouteParams from 'react-router/lib/getRouteParams'

import { Preload_method_name, Preload_options_name } from './middleware/preloading middleware'

// Returns function returning a Promise 
// which resolves when all the required preload()s are resolved.
//
// If no preloading is needed, then returns nothing.
//
export default function generate_preload_chain
(
	initial_client_side_preload,
	server,
	routes,
	components,
	getState,
	dispatch,
	history,
	location,
	parameters,
	preload_on_client_side_only,
	preload_helpers,
	preloading
)
{
	// A small client-side optimization.
	// Skips some of the `@preloads()`.
	if (!server)
	{
		components = only_changed_components(routes, components, parameters)
	}

	// Get all `preload` methods on the React-Router component chain
	let preloaders = collect_preloaders(components, preload_on_client_side_only)

	// Set `.preload({ ... })` function arguments,
	// and also set default `@preload()` options.
	set_up_preloaders
	(
		preloaders,
		{
			dispatch,
			getState,
			location,
			history,
			parameters,
			server,
			initial : initial_client_side_preload,
			...preload_helpers
		},
		server
	)

	// Only select those `@preload()`s which
	// should be run in current circumstances.
	preloaders = filter_preloaders(preloaders, server, initial_client_side_preload)

	// Construct a sequential chain out of preloaders.
	// Because each of them could be either parallel or sequential.
	const chain = chain_preloaders(preloaders)

	// If there are no `@preload()`s for this route, then exit.
	if (chain.length === 0)
	{
		return
	}

	// Return a function which generates preloading `Promise` chain.
	return () => promisify(chain, preloading)
}

// Finds all `preload` (or `preload_deferred`) methods 
// (they will be executed in parallel).
//
// @parameter components - `react-router` matched components
//
// @returns an array of `component_preloaders`.
// `component_preloaders` is an array of all
// `@preload()`s for a particular React component:
// objects having shape `{ preload(), options }`.
// Therefore the returned value is an array of arrays.
//
export function collect_preloaders(components, preload_on_client_side_only)
{
	// Find all static `preload` methods on the React-Router component chain
	return components
		// Some wrapper `<Route/>`s can have no `component`.
		// Select all components having `@preload()`.
		.filter(component => component && component[Preload_method_name])
		// Extract `@preload()` functions and their options.
		.map((component) => component[Preload_method_name].map((preload, i) =>
		({
			preload,
			options:
			{
				client: preload_on_client_side_only,
				blocking: true,
				blockingSibling: true,
				...component[Preload_options_name][i]
			}
		})))
		// // Flatten `@preload()` functions and their options.
		// .reduce((all, preload_and_options) => all.concat(preload_and_options), [])
}

// Applies default `@preload()` options
// and sets `@preload()` function arguments.
function set_up_preloaders(preloaders, preload_arguments, server)
{
	for (const component_preloaders of preloaders)
	{
		for (const preloader of component_preloaders)
		{
			set_up_preloader(preloader, preload_arguments, server)
		}
	}
}

// Applies default `@preload()` options
// and sets `@preload()` function arguments.
function set_up_preloader(preloader, preload_arguments, server)
{
	const preload = preloader.preload
	preloader.preload = () => preload(preload_arguments)

	// If Server-Side Rendering is not being used at all
	// then all `@preload()`s must be marked as client-side ones.
	// The `window._server_side_render` flag is actually never set in this library.
	// CC public website relies on it not being set so that all 
	// `@preload()`s re-run on client side for AWS S3 static hosted website.
	// If `window._server_side_render` flag is ever modified to be set (though unlikely)
	// then check that CC public website has `window._react_website_reload_data` set to `true`.
	// `window._react_website_reload_data` is automatically set to `true` 
	// by `react-website@latest`'s `static-site-generator` when it snapshots pages.
	if (!server && (!window._server_side_render || window._react_website_reload_data))
	{
		preloader.options.client = true
	}
}

// Selects only those `@preload()`s which
// should be run in current circumstances.
export function filter_preloaders(preloaders, server, initial_client_side_preload)
{
	// `preloaders` array will be mutated
	preloaders = preloaders.slice()

	preloaders.forEach((_, i) =>
	{
		preloaders[i] = preloaders[i].filter((preloader) =>
		{
			// Don't execute client-side-only `@preload()`s on server side
			if (preloader.options.client && server)
			{
				return false
			}

			// Don't execute server-side-only `@preload()`s on client side
			if (preloader.options.server && !server)
			{
				return false
			}

			// If it's initial client side preload (after the page has been loaded),
			// then only execute those `@preload()`s marked as "client-side-only".
			if (initial_client_side_preload && !preloader.options.client)
			{
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
		if (parallel.length === 0)
		{
			return chain
		}

		// Finalize pending parallel `preload`s

		if (parallel.length === 1)
		{
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
		return chain_preloaders
		(
			preloaders,
			chain,
			concat(parallel, get_preloader(preloader))
		)
	}

	if (parallel.length === 0)
	{
		return chain_preloaders
		(
			preloaders,
			concat(chain, get_preloader(preloader)),
			[]
		)
	}

	return chain_preloaders
	(
		preloaders,
		chain.concat
		({
			parallel: concat(parallel, get_preloader(preloader))
		}),
		[]
	)
}

function get_preloader(preloader)
{
	// A list of same component's `@preload()`s
	if (Array.isArray(preloader))
	{
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
	if (typeof chain === 'function')
	{
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
			if (preloading.cancelled)
			{
				return
			}

			return promisify(link, preloading)
		})
	},
	Promise.resolve())
}

// A minor optimization for skipping `@preload()`s
// for those parent `<Route/>`s which haven't changed
// as a result of a client-side navigation.
//
// On client side:
//
// Take the previous route components
// (along with their parameters) 
// and the next route components
// (along with their parameters),
// and compare them side-by-side
// filtering out the same top level components
// (both having the same component classes
//  and having the same parameters).
//
// Therefore @preload() methods could be skipped
// for those top level components which remain
// the same (and in the same state).
// This would be an optimization.
//
// (e.g. the main <Route/> could be @preload()ed only once - on the server side)
//
// At the same time, at least one component should be preloaded:
// even if navigating to the same page it still kinda makes sense to reload it.
// (assuming it's not an "anchor" hyperlink navigation)
//
// Parameters for each `<Route/>` component can be found using this helper method:
// https://github.com/ReactTraining/react-router/blob/master/modules/getRouteParams.js
//
// Also, GET query parameters would also need to be compared, I guess.
// But, I guess, it would make sense to assume that GET parameters
// only affect the last `<Route/>` component in the chain.
// And, in general, GET query parameters should be avoided,
// but that's not the case for example with search forms.
// So here we assume that GET query parameters only
// influence the last `<Route/>` component in the chain
// which is gonna be reloaded anyway.
//
function only_changed_components(routes, components, parameters)
{
	if (window._previous_routes)
	{
		const previous_routes     = window._previous_routes
		const previous_parameters = window._previous_route_parameters

		let i = 0
		while (i < routes.length - 1 && 
			previous_routes[i].component === routes[i].component &&
			deep_equal(getRouteParams(previous_routes[i], previous_parameters), getRouteParams(routes[i], parameters)))
		{
			i++
		}

		components = components.slice(i)
	}

	window._previous_routes           = routes
	window._previous_route_parameters = parameters

	return components
}

function concat(array, part)
{
	if (Array.isArray(part) && part.length > 1)
	{
		// Pushes an array
		return array.concat([part])
	}

	// Pushes a single element
	return array.concat(part)
}