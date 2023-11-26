let ReduxHotReloadFunction
let ReduxHotReloadFunctionDelayedRunArgument

export function startHotReload({ store }) {
	if (typeof window === 'undefined') {
		throw new Error('[react-pages] "hot reload" only works in a web browser')
	}
	// Updates Redux "reducers" and actions.
	ReduxHotReloadFunction = ({ reducers }) => {
		// `store.hotReload()` function is created in `./lib/redux/store.js`.
		store.hotReload(reducers)
	}
	// If if a hot reload has been requested before the page finished rendering.
	if (ReduxHotReloadFunctionDelayedRunArgument) {
		ReduxHotReloadFunction(ReduxHotReloadFunctionDelayedRunArgument)
		ReduxHotReloadFunctionDelayedRunArgument = undefined
	}
}

export function updateReducers(reducers) {
	if (typeof window === 'undefined') {
		throw new Error('[react-pages] `reducers` could only be updated in a web browser')
	}
	if (ReduxHotReloadFunction) {
		ReduxHotReloadFunction({ reducers })
	} else {
		ReduxHotReloadFunctionDelayedRunArgument = { reducers }
	}
}