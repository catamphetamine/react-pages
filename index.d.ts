import type { Match, LocationDescriptor, RouteObject as Route } from '@catamphetamine/found';
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
	LocationBasic,
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

interface ReduxModuleActionResultApplierFunction<State, Parameters extends any[] = any[]> {
	(state: State, ...args: Parameters): State
}

interface ReduxModuleAsyncAction<ReturnType, Parameters extends any[] = any[]> {
	(...args: Parameters): () => Promise<ReturnType>
}

export class ReduxModule<State = any, Action extends ReduxAction<string> = UnknownAction> {
	constructor(namespace?: string, settings?: object);
	// Deprecated?
	// Replaces an event handler with a custom one.
	replace(event: string, handler: Reducer): void;
	// Adds an event handler with a custom one.
	on(namespace: string, event: string, handler: Reducer): void;
	action<Parameters extends any[], Result>(event: string, action: ReduxModuleAsyncAction<Result, Parameters>, result: ReduxModuleActionResultApplier<State, Array<Result>>): ActionCreator<Action, Parameters>;
	action<Parameters extends any[], Result>(action: ReduxModuleAsyncAction<Result, Parameters>, result: ReduxModuleActionResultApplier<State, Array<Result>>): ActionCreator<Action, Parameters>;
	simpleAction<Parameters extends any[]>(event: string, result: ReduxModuleActionResultApplier<State, Parameters>): ActionCreator<Action, Parameters>;
	simpleAction<Parameters extends any[]>(result: ReduxModuleActionResultApplier<State, Parameters>): ActionCreator<Action, Parameters>;
	reducer(initialState?: object): Reducer<State, Action>;
}

export function underscoredToCamelCase(string: string): string;

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	to: string | LocationInput;
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
export function useRouter(): object;

// Deprecated Redux action creator functions.
export function goto(location: LocationInput, options?: NavigateOptions): object;
export function redirect(location: LocationInput, options?: RedirectOptions): object;
export function pushLocation(location: LocationInput, options?: NavigateOptions): object;
export function replaceLocation(location: LocationInput, options?: RedirectOptions): object;
export function goBack(): object;
export function goBackTwoPages(): object;
export function goForward(): object;

export function useBeforeNavigateToAnotherPage<NavigationContext = any>(callback: (parameters: { location: Location, route: string, params: Record<string, string>, instantBack: boolean, navigationContext?: NavigationContext }) => void): void;
export function useBeforeRenderAnotherPage<NavigationContext = any>(callback: (parameters: { location: Location, route: string, params: Record<string, string>, instantBack: boolean, navigationContext?: NavigationContext }) => void): void;
// export function useAfterNavigatedToAnotherPage<NavigationContext = any>(callback: (parameters: { location: Location, route: string, params: Record<string, string>, instantBack: boolean, navigationContext?: NavigationContext }) => void): void;
export function useAfterRenderedThisPage<NavigationContext = any>(callback: (parameters: { location: Location, route: string, params: Record<string, string>, instantBack: boolean, navigationContext?: NavigationContext }) => void): void;
export function useBeforeRenderNewPage<NavigationContext = any>(callback: (parameters: { location: Location, route: string, params: Record<string, string>, instantBack: boolean, navigationContext?: NavigationContext }) => void): void;
export function useAfterRenderedNewPage<NavigationContext = any>(callback: (parameters: { location: Location, route: string, params: Record<string, string>, instantBack: boolean, navigationContext?: NavigationContext }) => void): void;
export function useNavigationLocation(): LocationBasic;
// export function useSelectorForLocation(selector: (state: any) => unknown): any;
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

export function updateReducers(reducers: object): void;

// Navigation history.
// Each entry is an object having properties:
// * `route: string` — Example: "/user/:userId/post/:postId".
// * `action: string` — One of: "start", "push", "redirect", "back", "forward".
export interface NavigationHistory {
	route: string;
	action: 'start' | 'push' | 'redirect' | 'back' | 'forward';
}

export type PageLoadFunction<State = any, LoadContext = any, NavigationContext = any> = (parameters: {
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
	props?: Record<string, any>,
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

export type PageMetaFunction<State = any, PageStateReducerName = string, Props = Record<string, any>> = (parameters: {
	props: Props,
	useSelector: TypedUseSelectorHook<State>,
	usePageStateSelector: (reducerName: PageStateReducerName, selector: (state: State) => unknown) => any
}) => Record<string, PageMetaValue | PageMetaObject | PageMetaObject[]> | void;