import React from 'react'
import PropTypes from 'prop-types'

export const LocationContext = React.createContext()

export default function LocationProvider({ location, children }) {
	return (
		<LocationContext.Provider value={location}>
			{children}
		</LocationContext.Provider>
	)
}

LocationProvider.propTypes = {
	location: PropTypes.shape({
		pathname: PropTypes.string.isRequired,
		query: PropTypes.objectOf(PropTypes.string).isRequired,
		search: PropTypes.string.isRequired,
		hash: PropTypes.string.isRequired,

		// Miscellaneous (not used).

		// Some kind of a possibly-likely-unique key. Is empty for the initial page.
		key: PropTypes.string,

		// History entry state. Can be empty.
		state: PropTypes.any,

		// Index in browser history stack.
		index: PropTypes.number.isRequired,

		// The "delta" in terms of `index` change as a result of the navigation.
		// For example, a regular hyperlink click is `delta: 1`.
		// A "Back" action is `delta: -1`. A user could go several pages "Back".
		delta: PropTypes.number,

		// 'PUSH' or 'REPLACE' if the location was reached via history "push" or
    // "replace" action respectively. 'POP' on the initial location, or if
		// the location was reached via the browser "Back" or "Forward" buttons
		// or via `FarceActions.go`.
		action: PropTypes.oneOf(['PUSH', 'REPLACE', 'POP']).isRequired
	}),

	children: PropTypes.node
}