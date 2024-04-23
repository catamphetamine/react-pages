import type { Route } from '@catamphetamine/found';
// import type { Route } from 'found';

import type {
	Action as ReduxAction,
	Store,
	Dispatch,
	Reducer,
	Middleware,
	StoreEnhancer
} from 'redux';

import type {
	TypedUseSelectorHook
} from 'react-redux';

interface HttpClient {
	head: (...args: any) => Promise<any>;
	get: (...args: any) => Promise<any>;
	post: (...args: any) => Promise<any>;
	patch: (...args: any) => Promise<any>;
	put: (...args: any) => Promise<any>;
	delete: (...args: any) => Promise<any>;
	options: (...args: any) => Promise<any>;
}

// `superagent` request.
type HttpRequest_ = object;

interface SettingsBase<State, Action extends ReduxAction<string>> {
	reducers?: Record<string, Reducer>;
	reduxMiddleware?: Middleware[];
	reduxStoreEnhancers?: StoreEnhancer[];
	reduxEventNaming?: (event: string) => string[];

	http?: {
    findAndConvertIsoDateStringsToDateInstances?: boolean,

    transformUrl?: (url: string, { server: boolean }) => string,

    onRequest?: (request: HttpRequest_, parameters: {
    	url: string,
    	originalUrl: string,
    	useSelector: TypedUseSelectorHook<State>
    }) => void,

    onError?: (error: Error, parameters: {
    	location: Location,
    	url: string,
    	redirect: (to: string | Location) => void,
    	dispatch: Dispatch<Action>,
    	useSelector: TypedUseSelectorHook<State>
    }) => boolean | undefined,

    getErrorData?: (error: Error) => object,

    catch?: (error: Error, retryCount: number, parameters: {
    	getCookie: (name: string) => string | undefined,
    	store: Store<State, Action>,
    	http: HttpClient
    }) => Promise<void>
	};

	onLoadError?(error: Error, parameters: {
		location: Location,
		url: string,
		redirect: (to: string | Location) => void,
		dispatch: Dispatch<Action>,
		useSelector: TypedUseSelectorHook<State>,
		server: boolean
	}): void;

	// Deprecated?
	getLocale?: (state: State) => string;
}

interface SettingsNoCodeSplit<State, Action extends ReduxAction<string>> extends SettingsBase<State, Action> {
	routes: Route[];
}

interface SettingsCodeSplit<State, Action extends ReduxAction<string>, Context> extends SettingsBase<State, Action> {
	routes: RouteCodeSplitting<State, Action, Context>[];
	codeSplit: true;
}

export type Settings<State, Action extends ReduxAction<string>, Context> =
	SettingsNoCodeSplit<State, Action> |
	SettingsCodeSplit<State, Action, Context>;

// import { LocationDescriptor } from '@catamphetamine/farce';
// import { LocationDescriptor } from 'farce';
// export interface Location extends LocationDescriptor {
// 	origin: string;
// }
export interface Location {
	origin: string;
	pathname: string;
	search?: string;
	hash?: string;
}

// interface Route {
// 	path: string;
// 	Component: () => JSX.Element;
// }

interface RouteCodeSplitting<State, Action extends ReduxAction<string>, Context> {
	path: string;
	getComponent: () => Promise<() => JSX.Element>;

	meta: (state: State) => object;

	load: (parameters: {
		dispatch: Dispatch<Action>,
		useSelector: TypedUseSelectorHook<State>,
		params: object,
		location: Location,
		context?: Context,
		history: {
			route: string,
			action: string
		}[],
		server: boolean,
		getCookie: (name: string) => string | undefined
	}) => Promise<void>;
}