// https://github.com/ReactTraining/react-router/blob/master/modules/Link.js

import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import { preload_action } from './actions'

export default class Hyperlink extends Component
{
	static propTypes =
	{
		onClick  : PropTypes.func,
		target   : PropTypes.string,
		to       : PropTypes.oneOfType([ PropTypes.string, PropTypes.object, PropTypes.func ]),
		children : PropTypes.node
	}

	static contextTypes =
	{
		router : PropTypes.object.isRequired,
		store  : PropTypes.object.isRequired
	}

	constructor()
	{
		super()

		this.on_click = this.on_click.bind(this)
	}

	on_click(event)
	{
		const { onClick, to } = this.props
		const { router, store } = this.context
		
		if (!router)
		{
			throw new Error('<Link>s rendered outside of a router context cannot navigate.')
		}
		
		if (!store)
		{
			throw new Error('<Link>s rendered outside of a Redux context cannot navigate.')
		}

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

		if (isModifiedEvent(event) || !isLeftClickEvent(event))
		{
			return
		}

		event.preventDefault()

		store.dispatch(preload_action(resolveToLocation(to, router)))
	}

	render()
	{
		const { to, target, children, ...rest_props } = this.props
		const { router } = this.context

		if (!router)
		{
			throw new Error('<Link>s rendered outside of a router context cannot navigate.')
		}
		
		const location = resolveToLocation(to, router)

		// Is it a link to an absolute URL or to a relative (local) URL.
		const is_local_website_link = (typeof location === 'object')
			|| (typeof location === 'string' && location && location[0] === '/')

		if (target || is_local_website_link)
		{
			return <Link { ...this.props } onClick={ this.on_click }>{ children }</Link>
		}

		return <a href={ to } target={ target } { ...rest_props }>{ children }</a>
	}
}

// export default withRouter(Hyperlink)

function isLeftClickEvent(event)
{
	return event.button === 0
}

function isModifiedEvent(event)
{
	return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

function resolveToLocation(to, router)
{
	return typeof to === 'function' ? to(router.location) : to
}