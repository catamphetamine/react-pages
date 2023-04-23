// There is a `/client.js` file only in React >= 18.
import { createRoot, hydrateRoot } from 'react-dom/client'

export default function reactRender(reactElement, domElement) {
	const root = createRoot(domElement)
	root.render(reactElement)
	// The returned `root` seems to only be used in `showInitialLoad.js`.
	return { root }
}

export function hydrate(reactElement, domElement) {
	const root = hydrateRoot(domElement, reactElement)
}