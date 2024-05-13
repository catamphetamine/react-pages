import { isServerSideLoaded } from '../../client/flags.js'
import isObject from '../../isObject.js'

// Returns function returning a Promise
// which resolves when all the required page `load`s are resolved.
//
// If no loading is needed, then returns nothing.
//
export default function combineLoaders_
(
	loaders,
	server,
	isInitialClientSideLoad,
	useSelector,
	dispatch,
	location,
	params,
	history,
	context,
	getCookie,
	loading
)
{
	// Set `.load({ ... })` function arguments,
	// and also set default `load` options.
	normalizeLoadFunctions(
		loaders,
		{
			dispatch,
			useSelector,
			location,
			params,
			history,
			server,

			// `getCookie` `load` parameter has been requested:
			// https://github.com/catamphetamine/react-website/issues/71
			getCookie,

	    // (optional)
	    //
	    // "Load Context" could hold any custom developer-defined variables
	    // that could then be accessed inside `.load()` functions.
	    //
	    // To define a "load context":
	    //
	    // * Pass `getLoadContext()` function as an option to the client-side `render()` function.
	    //   The options are the second argument of that function.
	    //   The result of the function will be passed to each `load()` function as `context` parameter.
	    //   The result of the function will be reused within the scope of a given web browser tab,
	    //   i.e. `getLoadContext()` function will only be called once for a given web browser tab.
	    //
	    // * (if also using server-side rendering)
	    //   Pass `getLoadContext()` function as an option to the server-side `webpageServer()` function.
	    //   The options are the second argument of that function.
	    //   The result of the function will be passed to each `load()` function as `context` parameter.
	    //   The result of the function will be reused within the scope of a given HTTP request,
	    //   i.e. `getLoadContext()` function will only be called once for a given HTTP request.
	    //
	    // `getLoadContext()` function recevies an argument object: `{ dispatch }`.
	    // `getLoadContext()` function should return a "load context" object.
	    //
	    // Miscellaneous: `context` parameter will also be passed to `onNavigationFinished()`/`onBeforeNavigate()` functions.
	    //
			context
		},
		{
			server
		}
	)

	// Only select those `load`s which
	// should be run in current circumstances.
	loaders = filterLoaders(loaders, server, isInitialClientSideLoad)

	// Construct a sequential chain out of loaders.
	// Because each of them could be either parallel or sequential.
	const chain = combineLoaders(loaders)

	// If there are no `load`s for this route, then exit.
	if (chain.length === 0) {
		return
	}

	// Return a function that generates a `load()` `Promise` chain.
	const isCancelled = () => loading.cancelled
	return () => createPromiseFromLoaders(chain, isCancelled)
}

// Applies default `load` options
// and sets `load` function arguments.
function normalizeLoadFunctions(loaders, loadFunctionArgument, { server })
{
	for (const loadersOfComponent of loaders) {
		for (const loader of loadersOfComponent) {
			normalizeLoadFunction(loader, loadFunctionArgument, { server })
		}
	}
}

// Applies default `load` options
// and sets `load` function arguments.
function normalizeLoadFunction(loader, loadFunctionArgument, { server })
{
	const load = loader.load
	loader.load = () => load(loadFunctionArgument)

	// If Server-Side Rendering is not being used at all
	// then all `load`s must be marked as client-side ones.
	if (!server && !isServerSideLoaded()) {
		loader.options.client = true
	}
}

// Selects only those `load`s which
// should be run in current circumstances.
export function filterLoaders(loaders, server, isInitialClientSideLoad)
{
	// `loaders` array will be mutated
	loaders = loaders.slice()

	loaders.forEach((_, i) =>
	{
		loaders[i] = loaders[i].filter((loader) =>
		{
			// Don't execute client-side-only `load`s on server side
			if (loader.options.client && server) {
				return false
			}
			// Don't execute server-side-only `load`s on client side
			if (loader.options.server && !server) {
				return false
			}
			// If it's initial client side load (after the page has been loaded),
			// then only execute those `load`s marked as "client-side-only".
			if (isInitialClientSideLoad && !loader.options.client) {
				return false
			}
			return true
		})
	})

	return loaders.filter(loadersOfComponent => loadersOfComponent.length > 0)
}

// Constructs `load` chain.
//
// param `loaders` is an array of `loadersOfComponent`.
// `loadersOfComponent` is an array of all
// `load`s for a particular React component.
// Therefore `loaders` is an array of arrays.
export function combineLoaders(loaders, chain = [], parallel = [])
{
	// If all `load`s have been visited
	if (loaders.length === 0) {
		if (parallel.length === 0) {
			return chain
		}
		// Finalize pending parallel `load`s
		if (parallel.length === 1) {
			return chain.concat(parallel)
		}
		return chain.concat({ parallel })
	}

	// `loadersOfComponent` is an array of all `load`s for a particular React component.
	const loader = loaders[0]
	loaders = loaders.slice(1)

	if (!isBlockingLoader(loader)) {
		return combineLoaders(
			loaders,
			chain,
			concat(parallel, getLoadFunctionForLoader(loader))
		)
	}

	if (parallel.length === 0) {
		return combineLoaders(
			loaders,
			concat(chain, getLoadFunctionForLoader(loader)),
			[]
		)
	}

	return combineLoaders(
		loaders,
		chain.concat({ parallel: concat(parallel, getLoadFunctionForLoader(loader)) }),
		[]
	)
}

function getLoadFunctionForLoader(loader)
{
	// A list of same component's `load`s
	if (Array.isArray(loader)) {
		return combineLoaders(loader)
	}

	// Same component adjacent `load`
	return loader.load
}

function isBlockingLoader(loader)
{
	// A list of same component's `load`s
	if (Array.isArray(loader))
	{
		// Determine the proper `blocking` option
		// for this component's `load`s.
		for (const siblingLoader of loader)
		{
			// If any of component's `load`s are `blocking: true`
			// then all of them are `blocking: true`.
			if (siblingLoader.options.blocking)
			{
				return true
			}
		}

		return false
	}

	// Same component adjacent `load`
	return loader.options.blockingSibling
}

// Returns a `Promise` chain.
export function createPromiseFromLoaders(chain, isCancelled) {
	if (typeof chain === 'function') {
		return chain().then((result) => {
			if (isCancelled()) {
				return
			}
			return result
		})
	}

	if (isObject(chain)) {
		if (Array.isArray(chain.parallel)) {
			return Promise.all(
				chain.parallel.map(subChain => createPromiseFromLoaders(subChain, isCancelled))
			)
				.then((results) => {
					if (isCancelled()) {
						return
					}
					return results.filter(isResult).reduce((combined, result) => {
						if (combined) {
							return mergeResults(combined, result)
						}
						return result
					}, undefined)
				})
		} else {
			throw new Error('If loader chain element is an object then it should contain `parallel` property which should be an array of loader chains')
		}
	}

	if (Array.isArray(chain)) {
		return chain.reduce((promise, subChain) => {
			return promise.then((result) => {
				if (isCancelled()) {
					return
				}
				return createPromiseFromLoaders(subChain, isCancelled).then((subChainResult) => {
					if (isResult(result)) {
						if (isResult(subChainResult)) {
							return mergeResults(result, subChainResult)
						}
						return result
					}
					return subChainResult
				})
			})
		}, Promise.resolve())
	}

	throw new Error(`Unsupported loader chain: ${chain} of type ${typeof chain}`)
}

const BLANK_RESULT = {}

function isResult(result) {
	if (result === undefined) {
		return false
	}
	return isObject(result)
}

function mergeResults(result1, result2) {
	return {
		...result1,
		...result2
	}
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