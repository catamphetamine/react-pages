import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

@connect(({ preload, found }) => ({
	preloading: preload.pending,
	matchedLocation: found.match.location,
	previousLocation: found.resolvedMatch.location
}))
export default class RemountOnNavigate extends React.Component {
	static propTypes = {
		matchedLocation: PropTypes.object.isRequired,
		previousLocation: PropTypes.object.isRequired,
		children: PropTypes.node.isRequired
	}

	render() {
		const {
			preloading,
			matchedLocation,
			previousLocation,
			children
		} = this.props

		const location = preloading ? previousLocation : matchedLocation

		return (
			<div
				key={`${location.pathname}${location.search}`}
				className="remount-container">
				{children}
			</div>
		)
	}
}