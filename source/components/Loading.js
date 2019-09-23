import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'

import LoadingIndicator from './LoadingIndicator'
import FadeInOut from './FadeInOut'

export function Loading({
	initial,
	pending,
	immediate,
	indicator: Indicator,
	fadeOutDuration
}) {
	return (
		<div
			className={classNames('rrui__fixed-full-width', 'react-pages__loading', {
				'react-pages__loading--initial': initial,
				'react-pages__loading--shown': pending,
				'react-pages__loading--immediate': immediate
			})}>
			<FadeInOut show={pending} fadeOutDuration={fadeOutDuration}>
				<Indicator className="react-pages__loading-spinner"/>
			</FadeInOut>
		</div>
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