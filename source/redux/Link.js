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
		const { onClick, target, to } = this.props
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

		if (event.defaultPrevented)
		{
			return
		}

		event.preventDefault()

		if (isModifiedEvent(event) || !isLeftClickEvent(event))
		{
			return
		}

		// If target prop is set (e.g. to "_blank"), let browser handle link.
		if (target)
		{
			return
		}

		const location = resolveToLocation(to, router)

		// // Just perform a javascript redirect if a `location` is an absolute URL
		// if (typeof location === 'string')
		// {
		// 	if (location.indexOf('//') === 0 || location.indexOf('://') !== -1)
		// 	{
		// 		return document.location = location
		// 	}
		// }

		store.dispatch(preload_action(location))
	}

	render()
	{
		return <Link { ...this.props } onClick={ this.on_click }>{ this.props.children }</Link>
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