import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'

import LoadingIndicator from './LoadingIndicator'

@connect(({ preload }) =>
({
	pending   : preload.pending,
	immediate : preload.immediate
}))
export default class Loading extends Component
{
	static propTypes =
	{
		pending   : PropTypes.bool.isRequired,
		immediate : PropTypes.bool.isRequired,
		indicator : PropTypes.func.isRequired
	}

	static defaultProps =
	{
		indicator : LoadingIndicator
	}

	render()
	{
		const
		{
			pending,
			immediate,
			indicator : Indicator
		}
		= this.props

		return (
			<div
				className={classNames('rrui__fixed-full-width', 'react-website__loading',
				{
					'react-website__loading--shown'     : pending,
					'react-website__loading--immediate' : immediate
				})}>
				<Indicator className="react-website__loading-spinner"/>
			</div>
		)
	}
}