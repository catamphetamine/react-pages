// Not implemented.
export default function(state = {}, event) {
	switch (event.type) {
		case '@@react-pages/translation':
			// Put translation data in state.
			const { path, translation } = event
			return state

		default:
			return state
	}
}