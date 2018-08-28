import { UPDATE_MATCH, RESOLVE_MATCH, getRoutesByPath } from '../../router'
import { getComponentsMeta, mergeMeta, updateMeta } from '../../meta/meta'
import { getLocationUrl } from '../../location'

import {
	isInstantTransition,
	setInstantNavigationFlag,
	addInstantBack,
	resetInstantBack
} from '../client/instantBack'

export default function routerMiddleware(routes, codeSplit, onNavigate)
{
	let previousLocation
	let previousRouteIndices

	function updateMetaTags(routeIndices, state) {
		const routeChain = getRoutesByPath(routeIndices, routes)
		const meta = codeSplit ? getCodeSplitMeta(routeChain, state) : getComponentsMeta(routeChain.map(_ => _.Component), state)
		updateMeta(mergeMeta(meta))
	}

	return ({ dispatch, getState }) =>
	{
		return next => event =>
		{
			switch (event.type) {
				case UPDATE_MATCH:
					const { location, routeIndices } = event.payload

					// If it's an instant "Back"/"Forward" navigation
					// then navigate to the page without preloading it.
					// (has been previously preloaded and is in Redux state)
					const _isInstantTransition =
						location.action === 'POP' &&
						previousLocation &&
						isInstantTransition(previousLocation, location)

					// Set the flag for `wasInstantNavigation()`.
					setInstantNavigationFlag(_isInstantTransition)

					if (onNavigate) {
						onNavigate(getLocationUrl(location), location)
					}

					// Indicates whether an `instantBack` `<Link/>` was clicked.
					const instantBack = window._react_website_instant_back

					// Update instant back navigation chain.
					if (instantBack)
					{
						// Stores "current" (soon to be "previous") location
						// in "instant back chain", so that if "Back" is clicked
						// then such transition could be detected as "should be instant".
						addInstantBack(
							location,
							previousLocation,
							routeIndices,
							previousRouteIndices
						)
					}
					else if (!_isInstantTransition)
					{
						// If current transition is not "instant back" and not "instant"
						// then reset the whole "instant back" chain.
						// Only a consequitive "instant back" navigation chain
						// preserves the ability to instantly navigate "Back".
						// Once a regular navigation takes place
						// all previous "instant back" possibilities are discarded.
						resetInstantBack()
					}

					// `RESOLVE_MATCH` is not being emitted
					// for the first render for some reason.
					if (!previousLocation) {
						updateMetaTags(routeIndices, getState())
					}

					previousLocation = location
					previousRouteIndices = routeIndices

					break

				case RESOLVE_MATCH:
					updateMetaTags(event.payload.routeIndices, getState())
					break
			}

			return next(event)
		}
	}
}

function getCodeSplitMeta(routes, state) {
	return routes.map(_ => _.getMeta).filter(_ => _).map(_ => _(state))
}