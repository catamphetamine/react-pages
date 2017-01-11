export const Redirect  = '@@react-isomorphic-render/redirect'
export const GoTo      = '@@react-isomorphic-render/goto'
export const Navigated = '@@react-isomorphic-render/navigated'
export const Preload   = '@@react-isomorphic-render/preload'

export const redirect_action = (location) =>
({
	type: Redirect,
	location
})

export const goto_action = (location) =>
({
	type: GoTo,
	location
})

export const navigated_action = (location) =>
({
	type: Navigated,
	location
})

export const preload_action = (location) =>
({
	type: Preload,
	location
})