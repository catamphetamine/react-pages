import type {
	Settings
} from './types.d.js'

type ServerRenderOptions = object;

declare function renderOnServerSide<State, Action, Context>(settings: Settings<State, Action, Context>, options: ServerRenderOptions): void;

export default renderOnServerSide;

export function render<State, Action, Context>(
	parameters: {
		url: string,
		origin: string,
		headers: Record<string, string>
	},
	settings: Settings<State, Action, Context>, options: ServerRenderOptions
): {
	// `Set-Cookie` HTTP headers, in case any cookies are set.
	cookies: string[],
	status: number,
	content: string
};

export function renderError(error: Error, options: object): {
	status: number,
	content: string,
	contentType: string
};
