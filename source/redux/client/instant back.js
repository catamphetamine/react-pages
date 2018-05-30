const get = () => window._react_website_instant_back_chain || []
const set = (chain) => window._react_website_instant_back_chain = chain

/**
 * Is called when a `<Link/>` with `instantBack` property set is clicked.
 *
 * Stores "current" (soon to be "previous") location in "instant back chain",
 * so that if "Back" is clicked later then the transition to this
 * "current" (soon to be "previous") location is marked as "should be instant".
 *
 * "Instant back chain" consists of locations stored as a consequitive chain
 * and theoretically there can be more than one consequtive "instant back"-able
 * navigation in it (e.g. page1 -> page2 -> page3 -> "Back" -> page2 -> "Back" -> page3)
 * though I wouldn't advice doing that and would keep it minimal (a chain of two locations).
 *
 * Once a regular navigation is performed (i.e. not "instant one")
 * then the whole "instant back chain" is discarded.
 * E.g. a user clicks on `<Link instantBack/>` and is taken to a page
 * where he clicks on another `<Link/>` now without `instantBack` -
 * in this case all "instant back" history is discarded
 * and if the user clicks "Back" two times the second time won't be "instant".
 */
export function add_instant_back(nextLocation, previousLocation, nextLocationRoutes, previousLocationRoutes)
{
	let chain = get()

	// Discard "instant back" chain part having same routes.
	const sameRoutesIndex = indexOfByRoutes(chain, nextLocationRoutes)
	if (sameRoutesIndex >= 0) {
		chain = chain.slice(sameRoutesIndex + 1)
	}

	// If there is already an "instant" transition in the chain
	// then insert this transition into the chain
	// only if it's "page1 -> page2" and "page2 -> page3"
	// so that the chain becomes "page1 -> page2 -> page3".
	// Otherwise, the already existing "instant back" chain is reset.
	if (chain.length > 0)
	{
		let previousLocationIndex = indexOfByKey(chain, getLocationKey(previousLocation))

		if (previousLocationIndex < 0)
		{
			// console.error('[react-website] Error: previous location not found in an already existing instant back navigation chain', getLocationKey(previousLocation), chain)
			// Anomaly detected.
			// Reset the chain.
			// return reset_instant_back()

			// Basic recovery for cases where `history.replaceState()`
			// or `replaceHistory()` were called.
			// (e.g. Algolia "Instant Search" widget filters reconfigured)
			chain =
			[{
				key    : getLocationKey(previousLocation),
				routes : previousLocationRoutes
			}]
			previousLocationIndex = 0
		}

		// If transitioning from "page2" to "page3"
		// and the existing chain is "page1 -> page2 -> page4"
		// then trim the chain up to the "current" page
		// so that it becomes "page1 -> page2" (eligible for merging).
		chain = chain.slice(0, previousLocationIndex + 1)
	}
	else
	{
		// Add the "current" page to the chain.
		chain.push
		({
			key    : getLocationKey(previousLocation),
			routes : previousLocationRoutes
		})
	}

	// Add the "next" page to the chain.
	chain.push
	({
		key    : getLocationKey(nextLocation),
		routes : nextLocationRoutes
	})

	// Save the chain.
	set(chain)
}

/**
 * Checks if a "Back"/"Forward" transition should be "instant".
 * For "Back" transition it would mean that
 * the `<Link/>` has `instantBack` property set.
 * For "Forward" transition it would mean that
 * it's a reverse of an instant "Back" transition.
 * The order and position inside `chain` don't matter.
 */
export function is_instant_transition(fromLocation, toLocation)
{
	return indexOfByKey(get(), getLocationKey(fromLocation)) >= 0 &&
		indexOfByKey(get(), getLocationKey(toLocation)) >= 0
}

/**
 * Clears any "instant back" history.
 */
export const reset_instant_back = () => set()

/**
 * Each history `location` has a randomly generated `key`.
 * Except for the initial `location` which has no `key`.
 * (the very first entry in the browser history stack for a given tab)
 */
const getLocationKey = location => location.key ? location.key : 'initial'

function indexOfByKey(chain, key)
{
	let i = 0
	while (i < chain.length)
	{
		if (chain[i].key === key) {
			return i
		}
		i++
	}

	return -1
}

function indexOfByRoutes(chain, routes)
{
	let i = 0
	while (i < chain.length)
	{
		if (chain[i].routes.length === routes.length)
		{
			let j = 0
			while (j < routes.length)
			{
				if (chain[i].routes[j].component !== routes[j].component) {
					break
				}
				j++
			}
			if (j === routes.length) {
				return i
			}
		}
		i++
	}

	return -1
}