// import type { Route } from '@catamphetamine/found';
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

interface RouteWithOrWithoutCodeSplit<State, Action extends ReduxAction<string>, LoadContext> {
	path?: string;

	Component?: React.FC;
	getComponent?: () => Promise<React.FC>;

	meta?: (state: State) => object;

	load?: (parameters: {
		dispatch: Dispatch<Action>,
		useSelector: TypedUseSelectorHook<State>,
		params: Record<string, string>,
		location: Location,
		context?: LoadContext,
		history: {
			route: string,
			action: string
		}[],
		server: boolean,
		getCookie: (name: string) => string | undefined
	}) => Promise<void>;

	children?: RouteWithOrWithoutCodeSplit<State, Action, LoadContext>[];
}

export interface Settings<State, Action extends ReduxAction<string>, LoadContext> {
	routes: RouteWithOrWithoutCodeSplit<State, Action, LoadContext>[];
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
    	redirect: (to: LocationInput) => void,
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
		redirect: (to: LocationInput) => void,
		dispatch: Dispatch<Action>,
		useSelector: TypedUseSelectorHook<State>,
		server: boolean
	}): void;

	// Deprecated?
	getLocale?: (state: State) => string;

	codeSplit?: true;
}

// import { LocationDescriptor } from '@catamphetamine/farce';
// import { LocationDescriptor } from 'farce';
// export interface Location extends LocationDescriptor {
// 	origin: string;
// }

// // By defaul, `farce` and `found` use a location object
// // that doesn't have a `query` object and has a `search` string instead.
// // This library adds a `queryMiddleware` under the hood which parses `string` into `query`.
// export interface LocationBasic {
// 	origin: string;
// 	pathname: string;
// 	search?: string;
// 	hash?: string;
// }

export interface Location {
	// * `POP` for the initial location, or for any "back"/"forward"/"goto in history" navigation.
	// * `PUSH` when navigating to a new location.
	// * `REPLACE` when "redirecting" to a location via DOM API `history.replaceState()`.
	action: 'POP' | 'PUSH' | 'REPLACE';

	// `origin` is added by this library.
	// Example: "http://localhost:1234".
	origin: string;

	// Mimicks the `pathname` part of the DOM `location`:
	// everything after the `/` sign, including the `/` sign itself.
	// Is always non-empty.
	pathname: string;

	// URL query parameters object.
	//
	// By default, `farce` and `found` use a location object
	// that doesn't have a `query` object and has a `search` string instead.
	// This library adds a `queryMiddleware` under the hood which parses `string` into `query`.
	// The `queryMiddleware` is added into the list of middlewares when creating a Redux `store`.
	//
	query: Record<string, string>;

	// Mimicks the `search` part of the DOM `location`:
	// everything after the `?` sign, including the `?` sign itself.
	// `search` seems to always be present.
	// When there's no "hash" part of the URL, it's just an empty string `""`.
	search: string;

	// Mimicks the `hash` part of the DOM `location`:
	// everything after the `#` sign, including the `#` sign itself.
	// `hash` seems to always be present.
	// When there's no "hash" part of the URL, it's just an empty string `""`.
	hash: string;

	// Mimicks the `href` property of the DOM `location`:
	// The full location URL
	href: string;

	// `delta` is `+1` / `-1` / etc in case of a "goto in history" navigation like "back"/"forward".
	// In other circumstances, it's gonna be `0`.
	delta: number;

	// Example: "1234".
	port: string;

	// Example: "http:".
	protocol: string;

	// I'd guess, this mimicks the `state` argument that was passed to DOM functions
	// `history.pushState()` or `history.replaceState()`.
	// https://developer.mozilla.org/en-US/docs/Web/API/History_API
	// For example, they seem to store the scroll position in `location.state`.
	// My guess would be that when navigating not to a `location: string` but to a
	// `location: object`, one could pass the `state` as part of the `location`.
	state?: any;

	// The initial location has `key: undefined`.
	// Any subsequent locations have a (supposedly unique? not guaranteed?) key.
	// Example: "xdgl89:0".
	key?: string;

	// The index of the current location in the DOM (navigation) `history`.
	// Is `0` for the initial location.
	// Gets incremented for any subsequent "PUSH" navigation.
	// Doesn't get incremented for "REPLACE" navigation.
	index: number;
}

// The `location` argument that navigation functions accept.
export type LocationInput = string | {
	pathname: string;
	// One could pass URL query parameters either in the form of a `search` string
	// or in the form of a `query` object.
	query?: Record<string, string>;
	search?: string;
	hash?: string;
	state?: any;
};