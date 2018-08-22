import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Link from 'found/lib/Link'

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

		window._react_website_instant_back = instantBack
		setTimeout(() => window._react_website_instant_back = false, 0)
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