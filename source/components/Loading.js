import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'

import LoadingIndicator from './LoadingIndicator.js'
import FadeInOut from './FadeInOut.js'

export function Loading({
	initial,
	pending,
	immediate,
	indicator: Indicator,
	fadeOutDuration
}) {
	React.createElement(
		'div',
		{
			className: classNames('rrui__fixed-full-width', 'react-pages__loading', {
				'react-pages__loading--initial': initial,
				'react-pages__loading--shown': pending,
				'react-pages__loading--immediate': immediate
			})
		},
		React.createElement(
			FadeInOut,
			{
				show: pending,
				fadeOutDuration
			},
			React.createElement(Indicator, {
				className: 'react-pages__loading-spinner'
			})
		)
	)
}

Loading.propTypes = {
	initial: PropTypes.bool,
	pending: PropTypes.bool,
	immediate: PropTypes.bool,
	indicator: PropTypes.func.isRequired,
	fadeOutDuration: PropTypes.number.isRequired
}

Loading.defaultProps = {
	indicator: LoadingIndicator,
	fadeOutDuration: 160
}

export default connect(({ preload }) => ({
	initial: preload.initial,
	pending: preload.pending,
	immediate: preload.immediate
}))(Loading)