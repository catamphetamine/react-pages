import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'

import LoadingIndicator from './LoadingIndicator'
import FadeInOut from './FadeInOut'

export class Loading extends React.Component
{
	static propTypes =
	{
		initial   : PropTypes.bool.isRequired,
		pending   : PropTypes.bool.isRequired,
		immediate : PropTypes.bool.isRequired,
		indicator : PropTypes.func.isRequired,
		fadeOutDuration : PropTypes.number.isRequired
	}

	static defaultProps =
	{
		indicator : LoadingIndicator,
		fadeOutDuration : 160
	}

	render()
	{
		const
		{
			initial,
			pending,
			immediate,
			indicator : Indicator,
			fadeOutDuration
		}
		= this.props

		return (
			<div
				className={classNames('rrui__fixed-full-width', 'react-pages__loading',
				{
					'react-pages__loading--initial'   : initial,
					'react-pages__loading--shown'     : pending,
					'react-pages__loading--immediate' : immediate
				})}>
				<FadeInOut show={pending} fadeOutDuration={fadeOutDuration}>
					<Indicator className="react-pages__loading-spinner"/>
				</FadeInOut>
			</div>
		)
	}
}

export default connect(({ preload }) => ({
	initial   : preload.initial,
	pending   : preload.pending,
	immediate : preload.immediate
}))(Loading)