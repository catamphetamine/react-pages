import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'

import LoadingIndicator from './LoadingIndicator'
import FadeInOut from './FadeInOut'

@connect(({ preload }) =>
({
	pending   : preload.pending,
	immediate : preload.immediate
}))
export default class Loading extends React.Component
{
	static propTypes =
	{
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
			pending,
			immediate,
			indicator : Indicator,
			fadeOutDuration
		}
		= this.props

		return (
			<div
				className={classNames('rrui__fixed-full-width', 'react-website__loading',
				{
					'react-website__loading--shown'     : pending,
					'react-website__loading--immediate' : immediate
				})}>
				<FadeInOut show={pending} fadeOutDuration={fadeOutDuration}>
					<Indicator className="react-website__loading-spinner"/>
				</FadeInOut>
			</div>
		)
	}
}