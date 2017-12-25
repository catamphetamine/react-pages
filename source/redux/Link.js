// https://github.com/ReactTraining/react-router/blob/master/modules/Link.js

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import { start_preload } from './preload/actions'

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

		// Content
		children : PropTypes.node
	}

	static defaultProps =
	{
		instantBack : false
	}

	static contextTypes =
	{
		// `react-router` context required
		router : PropTypes.object.isRequired,
		
		// `react-redux` context required
		store  : PropTypes.object.isRequired
	}

	constructor()
	{
		super()

		this.on_click = this.on_click.bind(this)
	}

	on_click(event)
	{
		const { onClick, onNavigate, to, instantBack } = this.props
		const { router, store } = this.context
		
		// Sanity check
		if (!router)
		{
			throw new Error('<Link>s rendered outside of a router context cannot navigate.')
		}
		
		// Sanity check
		if (!store)
		{
			throw new Error('<Link>s rendered outside of a Redux context cannot navigate.')
		}

		// User may have supplied his own `onClick` handler
		if (onClick)
		{
			onClick(event)
		}

		// `onClick` could call `event.preventDefault()`
		// to intercept `react-router` navigation.
		if (event.defaultPrevented)
		{
			return
		}

		// Only process left mouse button clicks without modifier keys pressed
		if (isModifiedEvent(event) || !isLeftClickEvent(event))
		{
			return
		}

		// Cancel `react-router` navigation inside its own `<Link/>`
		event.preventDefault()

		if (onNavigate)
		{
			onNavigate()
		}

		// Firt preload the new page, then `history.push()` will be called,
		// and `react-router` will detect that performing the route transition.
		store.dispatch(start_preload(resolveToLocation(to, router), undefined, undefined, undefined, instantBack))
	}

	render()
	{
		const { instantBack, onNavigate, ...link_props } = this.props
		const { to, target, children, ...rest_props } = link_props
		const { router } = this.context

		// Sanity check
		if (!router)
		{
			throw new Error('<Link>s rendered outside of a router context cannot navigate.')
		}
		
		// `to` could be a function of the current `location`
		const location = resolveToLocation(to, router)

		// Is it a link to an absolute URL or to a relative (local) URL.
		const is_local_website_link = (typeof location === 'object')
			|| (typeof location === 'string' && location && location[0] === '/')

		if (is_local_website_link && !target)
		{
			return <Link { ...link_props } onClick={ this.on_click }>{ children }</Link>
		}

		// External links (or links with `target` specified, like "open in a new tab")
		return <a href={ to } target={ target } { ...rest_props }>{ children }</a>
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

// `to` could be a function of the current `location`
function resolveToLocation(to, router)
{
	return typeof to === 'function' ? to(router.location) : to
}