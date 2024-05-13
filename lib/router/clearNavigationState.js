import { clearInContext } from '../context.js'

// Clears any navigation-related context info
// because it's gonna be a new (unrelated) navigation
// as part of the upcoming redirect.
export default function clearNavigationState() {
	clearInContext('Navigation/IsInstantBack')
	clearInContext('Navigation/Context')
	clearInContext('Navigation/SkipLoad')
}