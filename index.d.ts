import type { Match, LocationDescriptor, RouteObject as Route, useRouter as useRouterFromFound } from '@catamphetamine/found';
// import type { Match, LocationDescriptor } from 'found';

export type { RouteObject as Route } from '@catamphetamine/found';

import type {
	Dispatch,
	Action as ReduxAction,
	ActionCreator,
	Reducer,
	UnknownAction
} from 'redux';

import type {
	TypedUseSelectorHook
} from 'react-redux';

import type {
	Location,
	LocationInput,
	HttpClient
} from './types.d.js';

export type {
	Location,
	LocationInput,
	Settings,
	HttpClient
} from './types.d.js'

export interface LocationHistory {
	push(location: LocationInput): void;
	replace(location: LocationInput): void;
	go(position: number): void;
}

export interface NavigateOptions {
	load?: boolean;
	instantBack?: boolean;
	context?: any;
}

export interface RedirectOptions {
	load?: boolean;
}

export function getHttpClient(): HttpClient;

export function getPreferredLocale(): string | undefined;
export function getPreferredLocales(): string[];

export function getLanguageFromLocale(locale: string): string;

export function wasInstantNavigation(): boolean;
export function isInstantBackAbleNavigation(): boolean;
export function canGoBackInstantly(): boolean;
export function canGoForwardInstantly(): boolean;

type ReduxModuleActionResultApplier<State, Parameters extends any[]> = string | ReduxModuleActionResultApplierFunction<State, Parameters>;

type ReduxModuleActionResultApplierFunction<State, Parameters extends any[] = any[]> = (state: State, ...args: Parameters) => State

type ReduxModuleAsyncAction<ReturnType, Parameters extends any[] = any[]> = (...args: Parameters) => (http: HttpClient) => Promise<ReturnType>

export type Settings = Record<string, any>

export class ReduxModule<State = any, Action extends ReduxAction<string> = UnknownAction> {
	constructor(namespace?: string, settings?: Settings);
	// Deprecated?
	// Replaces an event handler with a custom one.
	replace(event: string, handler: Reducer): void;
	// Adds an event handler with a custom one.
	on(namespace: string, event: string, handler: Reducer): void;
	on(namespaceAndEvent: string, handler: Reducer): void;
	action<Parameters extends any[], Result>(event: string, action: ReduxModuleAsyncAction<Result, Parameters>, result: ReduxModuleActionResultApplier<State, Array<Result>>): ActionCreator<Action, Parameters>;
	action<Parameters extends any[], Result>(event: string, action: ReduxModuleAsyncAction<Result, Parameters>): ActionCreator<Action, Parameters>;
	action<Parameters extends any[], Result>(action: ReduxModuleAsyncAction<Result, Parameters>, result: ReduxModuleActionResultApplier<State, Array<Result>>): ActionCreator<Action, Parameters>;
	action<Parameters extends any[], Result>(action: ReduxModuleAsyncAction<Result, Parameters>): ActionCreator<Action, Parameters>;
	simpleAction<Parameters extends any[]>(event: string, result: ReduxModuleActionResultApplier<State, Parameters>): ActionCreator<Action, Parameters>;
	simpleAction<Parameters extends any[]>(result: ReduxModuleActionResultApplier<State, Parameters>): ActionCreator<Action, Parameters>;
	reducer(initialState?: State): Reducer<State, Action>;
}

export function underscoredToCamelCase(string: string): string;

interface LinkProps<NavigationContext = any> extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	to: string | LocationInput;
	navigationContext?: NavigationContext;
}

export const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;

export function getCookie(name: string): string | undefined;

// `<Redirect/>` route.
export interface Redirect {
	path?: string;
	to: string | ((match: Match) => LocationDescriptor);
	status?: number;
}

// Returns a `found` router object.
export const useRouter: useRouterFromFound

// These are "older" ways of `dispatch()`-ing Redux actions to perform a navigation action.
// In React components code, consider using the corresponding hooks instead.
//
// These Redux action creators are still not removed though:
//
// * Older projects might still be using them. By not removing those actions,
//   the migration path is easier for those "legacy" projects.
//
// * In some edge cases, it may be required to perform a navigation action from somewhere
//   outside of any React component: for example, from a Redux "middleware".
//   For example, one could be using `import { isRejectedWithValue } from '@reduxjs/toolkit'`
//   in order to detect errors and then redirect to the `/error` page if there was an error.
//
export function goto(location: LocationInput, options?: NavigateOptions): UnknownAction;
export function redirect(location: LocationInput, options?: RedirectOptions): UnknownAction;
export function pushLocation(location: LocationInput, options?: NavigateOptions): UnknownAction;
export function replaceLocation(location: LocationInput, options?: RedirectOptions): UnknownAction;
export function goBack(): UnknownAction;
export function goBackTwoPages(): UnknownAction;
export function goForward(): UnknownAction;

export interface NavigationPage<NavigationContext> {
	location: Location;
	route: string;
	params: Record<string, string>;
	instantBack: boolean;
	navigationContext?: NavigationContext;
}

export function useBeforeNavigateToAnotherPage<NavigationContext = any>(callback: (newPage: NavigationPage<NavigationContext>) => void): void;
export function useBeforeRenderAnotherPage<NavigationContext = any>(callback: (newPage: NavigationPage<NavigationContext>) => void): void;
// export function useAfterNavigatedToAnotherPage<NavigationContext = any>(callback: (newPage: NavigationPage<NavigationContext>) => void): void;
export function useAfterRenderedThisPage<NavigationContext = any>(callback: (newPage: NavigationPage<NavigationContext>) => void): void;
export function useBeforeRenderNewPage<NavigationContext = any>(callback: (newPage: NavigationPage<NavigationContext>, prevPage?: NavigationPage<NavigationContext>) => void): void;
export function useAfterRenderedNewPage<NavigationContext = any>(callback: (newPage: NavigationPage<NavigationContext>, prevPage?: NavigationPage<NavigationContext>) => void): void;
export function useNavigationLocation(): Location;
export function usePageStateSelector<State = any, PageStateReducerName = string, Selector extends (state: State) => unknown = (state: State) => unknown>(reducerName: PageStateReducerName, selector: Selector): ReturnType<Selector>;
export function usePageStateSelectorOutsideOfPage<State = any, PageStateReducerName = string, Selector extends (state: State) => unknown = (state: State) => unknown>(reducerName: PageStateReducerName, selector: Selector): ReturnType<Selector>;
export function useLocation(): Location;
export function useLocationHistory(): LocationHistory;
export function useGoBack(): () => void;
export function useGoForward(): () => void;
export function useNavigate(): (location: LocationInput, options?: NavigateOptions) => void;
export function useRedirect(): (location: LocationInput, options?: RedirectOptions) => void;
export function useLoading(): boolean;
export function useRoute(): Route;

export function updateReducers<State = any, Action extends ReduxAction<string> = UnknownAction>(reducers: Record<string, Reducer<State, Action>>): void;

// Navigation history.
// Each entry is an object having properties:
// * `route: string` — Example: "/user/:userId/post/:postId".
// * `action: string` — One of: "start", "push", "redirect", "back", "forward".
export interface NavigationHistory {
	route: string;
	action: 'start' | 'push' | 'redirect' | 'back' | 'forward';
}

export type PageLoadFunction<Props = Record<string, any>, State = any, LoadContext = any, NavigationContext = any> = (parameters: {
  dispatch: Dispatch,
  useSelector: TypedUseSelectorHook<State>,
  context?: LoadContext,
  navigationContext?: NavigationContext,
  location: Location,
  params: Record<string, string>,
  history: NavigationHistory,
  server: boolean;
  getCookie: (name: string) => string | null;
}) => Promise<{
	props?: Props,
	redirect?: {
		url: string
	}
} | void>;

// export interface PageMetaImage {
// 	// `_` is image URL.
//   _: string;
//   width: number;
//   height: number;
//   type: string;
// }

type PageMetaValue = string | number | boolean;

// Objects are expanded: `{ a: { b: 'c' } }` becomes `<meta property="a:b" content="c"/>`.
// Arrays of values are expanded: `[{ a: 'b' }, { a: 'c' }]` becomes `<meta property="a" content="b"/>` and `<meta property="a" content="c"/>`.
// Arrays of objects are expanded: `[{ a: { b: 'c' } }, { a: { b: 'd' } }]` becomes `<meta property="a:b" content="c"/>` and `<meta property="a:b" content="d"/>`.
type PageMetaObject = Record<string, PageMetaValue>;

export type PageMetaFunction<Props = Record<string, any>, State = any, PageStateReducerName = string> = (parameters: {
	props: Props,
	useSelector: TypedUseSelectorHook<State>,
	usePageStateSelector: (reducerName: PageStateReducerName, selector: (state: State) => unknown) => any
}) => Record<string, PageMetaValue | PageMetaObject | PageMetaObject[]> | void;
