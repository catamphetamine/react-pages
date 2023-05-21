import { onHideListeners, isHidden, showTimer } from './showInitialLoad.js'

// In cases when the initial page immediately redirects
// to another page (for example, to a "not found" page),
// a `RedirectException` is thrown in `setUpAndRender()` function
// in which case that function re-runs from scratch.
//
// That would result in `showInitialLoad()` function
// getting called multiple times, resulting in it creating
// multiple `<InitialLoadingContainer/>` DOM Elements.
//
// Therefore, when calling `hideInitialLoad()`,
// it should assume there're multiple initial `load`s on a page.

// let containers = []
// let refs = []

export default function hideInitialLoad() {
	// const container = containers.pop()
	// const ref = refs.pop()

	// ref.setFinishedLoading(() => {
	// 	setTimeout(() => {
	// 		ReactDOM.unmountComponentAtNode(container)
	// 		document.body.removeChild(container)
	// 	}, 160)
	// })

	for (const onHideListener of onHideListeners) {
		onHideListener()
	}

	isHidden.current = true

	clearTimeout(showTimer.current)
	showTimer.current = undefined
}