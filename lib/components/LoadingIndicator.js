// Copy-pasted from `react-responsive-ui/src/ActivityIndicator.js`.

// Taken from:
// https://loading.io/css/
//
// A colored variation:
// https://codeburst.io/how-to-create-a-simple-css-loading-spinner-make-it-accessible-e5c83c2e464c

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

export default function ActivityIndicator(props) {
	const arc = React.createElement(
		'div',
		{ className: 'rrui__activity-indicator__arc' }
	)
	return React.createElement(
		'div',
		{
			...props,
			className: classNames('rrui__activity-indicator', props.className)
		},
		arc,
		arc,
		arc,
		arc
	)
}

ActivityIndicator.propTypes = {
	// CSS class
	className: PropTypes.string
}