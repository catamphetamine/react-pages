// https://github.com/ReactTraining/react-router/blob/master/modules/Link.js

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import { connect } from 'react-redux'
import { start_preload } from './preload/actions'

@connect(() => ({}), {
	startPreload : start_preload
})
export default class Hyperlink extends Component
{
	static propTypes =
	{
		// User may supply his own `onClick(event)` handler
		onClick  : PropTypes.func,

		// HTML `<a target={...}>` attribute
		target   : PropTypes.string,

		// Link destination
		// (a URL, or a location object,
		//  or a function of the current location)
		to       : PropTypes.oneOfType
		([
			PropTypes.string,
			PropTypes.object,
			PropTypes.func
		]),

		// Set to `true` to disable page `@preload()`ing
		// when navigating "Back"
		instantBack : PropTypes.bool.isRequired,

		// `react-router` property for `<IndexLink/>`.
		onlyActiveOnIndex : PropTypes.bool,

		// Content
		children : PropTypes.node
	}

	static defaultProps =
	{
		instantBack : false
	}

	onClick = (event) =>
	{
		const
		{
			onClick,
			onNavigate,
			to,
			instantBack,
			startPreload
		}
		= this.props

		// // Sanity check
		// if (!router) {
		// 	throw new Error('<Link>s rendered outside of a router context cannot navigate.')
		// }

		// User may have supplied his own `onClick` handler
		if (onClick) {
			onClick(event)
		}

		// `onClick` could call `event.preventDefault()`
		// to intercept `react-router` navigation.
		if (event.defaultPrevented) {
			return
		}

		// Only process left mouse button clicks without modifier keys pressed
		if (isModifiedEvent(event) || !isLeftClickEvent(event)) {
			return
		}

		// Cancel `react-router` navigation inside its own `<Link/>`
		event.preventDefault()

		if (onNavigate) {
			onNavigate()
		}

		// Firt preload the new page, then `history.push()` will be called,
		// and `react-router` will detect that performing the route transition.
		startPreload(to, { instantBack })
	}

	render()
	{
		const
		{
			startPreload,
			instantBack,
			onNavigate,
			...link_props
		}
		= this.props

		const
		{
			to,
			target,
			onlyActiveOnIndex,
			activeClassName,
			activeStyle,
			children,
			...rest_props
		}
		= link_props

		// // Sanity check
		// if (!router) {
		// 	throw new Error('<Link>s rendered outside of a router context cannot navigate.')
		// }

		// Is it a link to an absolute URL or to a relative (local) URL.
		const is_local_website_link = (typeof to === 'object')
			|| (typeof to === 'string' && to && to[0] === '/')

		if (is_local_website_link && !target)
		{
			return (
				<Link
					onClick={ this.onClick }
					{ ...link_props }>
					{ children }
				</Link>
			)
		}

		// External links (or links with `target` specified, like "open in a new tab")
		return (
			<a
				href={ to }
				target={ target }
				{ ...rest_props }>
				{ children }
			</a>
		)
	}
}

// export default withRouter(Hyperlink)

// Is it a left mouse button click
function isLeftClickEvent(event)
{
	return event.button === 0
}

// Was a modifier key pressed during the event
function isModifiedEvent(event)
{
	return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}