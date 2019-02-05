import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Link from 'found/lib/Link'

import { markImmediateNavigationAsInstantBack } from './client/instantBack'

export default class HyperLink extends Component
{
	static propTypes = {
		instantBack: PropTypes.bool
	}

	onClick = (event) => {
		const { instantBack, onClick } = this.props
		if (onClick) {
			onClick(event)
		}
		if (event.defaultPrevented) {
			return
		}
		markImmediateNavigationAsInstantBack(instantBack)
	}

	render() {
		const {
			instantBack,
			onClick,
			...rest
		} = this.props

		return (
			<Link {...rest} onClick={this.onClick}/>
		)
	}
}