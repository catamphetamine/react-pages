import type {
	Location,
	HttpClient
} from './types.d.js';

import type {
	Action as ReduxAction,
	Reducer,
	UnknownAction
} from 'redux';

export interface LocationHistory {
	push(location: Location): void;
	replace(location: Location): void;
	go(position: number): void;
}

export interface NavigateOptions {
	load?: boolean;
	instantBack?: boolean;
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

type ReduxModuleAsyncAction = () => (http: HttpClient) => Promise<any>;
type ReduxModuleActionResultApplier = string | ((state: object, value?: any) => object);

export class ReduxModule<State = any, Action extends ReduxAction<string> = UnknownAction> {
	constructor(namespace?: string, settings?: object);
	// Deprecated?
	// Replaces an event handler with a custom one.
	replace(event: string, handler: Reducer): void;
	// Adds an event handler with a custom one.
	on(namespace: string, event: string, handler: Reducer): void;
	action(event: string, action: ReduxModuleAsyncAction, result: ReduxModuleActionResultApplier): object;
	action(action: ReduxModuleAsyncAction, result: ReduxModuleActionResultApplier): object;
	simpleAction(event: string, result: ReduxModuleActionResultApplier): object;
	simpleAction(result: ReduxModuleActionResultApplier): object;
	reducer(initialState?: object): Reducer<State, Action>;
}

export function underscoredToCamelCase(string: string): string;

export const Link: (props: object) => JSX.Element;

export function getCookie(name: string): string | undefined;

// `<Redirect/>` route.
export const Redirect: (props: object) => JSX.Element;

// Returns a `found` router object.
export function useRouter(): object;

// Deprecated Redux action creator functions.
export function goto(location: string | Location, options?: NavigateOptions): object;
export function redirect(location: string | Location, options?: RedirectOptions): object;
export function pushLocation(location: string | Location, options?: NavigateOptions): object;
export function replaceLocation(location: string | Location, options?: RedirectOptions): object;
export function goBack(): object;
export function goBackTwoPages(): object;
export function goForward(): object;

export function useNavigationStartEffect(callback: (...args: any) => void): void;
export function useNavigationEndEffect(callback: (...args: any) => void): void;
export function useNavigationLocation(): Location;
export function useSelectorForLocation(selector: (state: any) => unknown): any;
export function useLocation(): Location;
export function useLocationHistory(): LocationHistory;
export function useGoBack(): void;
export function useGoForward(): void;
export function useNavigate(location: string | Location, options?: NavigateOptions): void;
export function useRedirect(location: string | Location, options?: RedirectOptions): void;
export function useLoading(): boolean;
export function useRoute(): {
	path: string,
	params: object,
	location: Location
};

export function updateReducers(reducers: object): void;
