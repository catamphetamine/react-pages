import type {
	Store,
  Dispatch,
	Action as ReduxAction,
  UnknownAction,
  StoreEnhancer
} from 'redux';

import type {
	TypedUseSelectorHook
} from 'react-redux';

import type {
	Config as ReduxDevToolsConfig,
	InferComposedStoreExt
} from '@redux-devtools/extension';

import type {
	Location,
	Settings
} from './types.d.js'

type UseSelector = <State>(selector: (state: State) => any) => any;

interface ClientRenderOptions<State, Action extends ReduxAction<string>, Context> {
  // Gets called on the initial page load, and then on each navigation.
  onPageRendered?(parameters: {
    // Relative URL.
    url: string,
    // URL `location`.
    location: Location,
    // URL pathname parameters.
    params: Record<string, string>,
    // (optional) If `getLoadContext()` function is defined,
    // this will be the result of calling that function.
    context?: Context,
    // Redux `dispatch()` function.
    dispatch: Dispatch<Action>,
    // Mimicks Redux `useSelector()` hook.
    useSelector: TypedUseSelectorHook<State>
  }): void;

  // Gets called before each navigation.
  // Doesn't get called on the initial page load.
	onBeforeNavigate?(parameters: {
    // URL `location`.
		location: Location,
    // URL pathname parameters.
		params: Record<string, string>,
    // (optional) If `getLoadContext()` function is defined,
    // this will be the result of calling that function.
		context?: Context,
    // Redux `dispatch()` function.
		dispatch: Dispatch<Action>,
    // Mimicks Redux `useSelector()` hook.
		useSelector: TypedUseSelectorHook<State>
	}): void;

	// Redux DevTools settings.
	devtools?: {
		// A custom `redux-devtools` `compose` function.
		// By default, it uses a production-intended (no op?) one.
		// A developer can supply a development-intended one in a development environment.
		compose?: (config: ReduxDevToolsConfig) => <StoreEnhancers extends readonly StoreEnhancer<unknown>[]>(
			...funcs: StoreEnhancers
		) => StoreEnhancer<InferComposedStoreExt<StoreEnhancers>>,

		// The `config` argument that the `compose()` function will be called with.
		options?: ReduxDevToolsConfig
	};

	// // Reports page loading stats on the server side.
	// stats?({
	// 	url: string,
	// 	route: string,
	// 	time: {
	// 		loadAndRender: number
	// 	}
	// }): void;

	// Returns a `context` parameter for the page `.load()` functions.
	getLoadContext?(parameters: {
		dispatch: Dispatch<Action>
	}): Context;

  // Deprecated.
  // Gets called with a Redux store as an argument.
  // Is currenly used on Acadeum Course Share website.
  onStoreCreated?(store: Store<State, Action>): void;
}

export function render<State = any, Action extends ReduxAction<string> = UnknownAction, Context = any>(settings: Settings<State, Action, Context>, options?: ClientRenderOptions<State, Action, Context>): Promise<{
	enableHotReload: () => void
}>;

// Looks like the `createStore()` function export is deprecated due to being unused.
// In case of uncommenting this, `object` would have to be replaced with something proper.
// export function createStore(settings: object, options: object | undefined, { stash }): object;