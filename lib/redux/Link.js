import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

// `@catamphetamine/found` is a fork of `found` with some changes:
// * `redux` and `react-redux` are `peerDependencies` instead of `dependencies`.
// * `farce` was replaced with `@catamphetamine/farce`.
// * Fixed a bug when `found` ignores all navigation actions until its `componentDidMount()` is called.
import { withRouter } from '@catamphetamine/found'

import { setInstantBackAbilityFlagForThisNavigation } from './client/instantNavigation.js'
import { setNavigationContext } from '../router/actions.js'
import isObject from '../isObject.js'

// `found`'s `src/BaseLink.js` doesn't have a `.focus()` method
// and doesn't forward `ref` which prevents it from being
// focusable programmatically.
//
//https://github.com/4Catalyzer/found/blob/master/src/Link.js
// https://github.com/4Catalyzer/found/blob/master/src/BaseLink.js
//
// Therefore, copy-pasted it here and added `React.forwardRef()`.
//
function BaseLink({
  as: Component,
  to,
  match,
  navigationContext,
  activeClassName,
  activeStyle,
  activePropName,
  router,
  exact,
  ...props
}, ref) {
  if (!(typeof to === 'string') && !isObject(to)) {
    throw new Error('[react-pages] `to` property (string or object) is required on a `<Link/>`')
  }

	const { onClick, target } = props

  const onClick_ = useCallback((event) => {
    if (onClick) {
      onClick(event)
    }

    // Don't do anything if the user's onClick handler prevented default.
    // Otherwise, let the browser handle the link with the computed href if the
    // event wasn't an unmodified left click, or if the link has a target other
    // than _self.
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.button !== 0 ||
      (target && target !== '_self')
    ) {
      return
    }

    event.preventDefault()

    if (navigationContext) {
      setNavigationContext(navigationContext)
    }

    // FIXME: When clicking on a link to the same location in the browser, the
    // actual becomes a replace rather than a push. We may want the same
    // handling – perhaps implemented in the Farce protocol.
    router.push(to)
  }, [
  	onClick,
  	target,
  	to,
  	router
  ])

  const href = router.createHref(to)
  const childrenIsFunction = typeof props.children === 'function'

  if (
    childrenIsFunction ||
    activeClassName ||
    activeStyle ||
    activePropName
  ) {
    const toLocation = router.createLocation(to)
    const active = router.isActive(match, toLocation, { exact })

    if (childrenIsFunction) {
      return props.children({ href, active, onClick: this.onClick })
    }

    if (active) {
      if (activeClassName) {
        props.className = props.className
          ? `${props.className} ${activeClassName}`
          : activeClassName
      }

      if (activeStyle) {
        props.style = { ...props.style, ...activeStyle }
      }
    }

    if (activePropName) {
      props[activePropName] = active
    }
  }

  return React.createElement(Component, {
    ref,
    ...props,
    href,
    onClick: onClick_
  })
}

BaseLink = React.forwardRef(BaseLink)

BaseLink.propTypes = {
  as: PropTypes.elementType.isRequired,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  match: PropTypes.object.isRequired,
  activeClassName: PropTypes.string,
  activeStyle: PropTypes.object,
  activePropName: PropTypes.string,
  navigationContext: PropTypes.any,
  router: PropTypes.object.isRequired,
  exact: PropTypes.bool.isRequired,
  target: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func])
}

BaseLink.defaultProps = {
  as: 'a',
  exact: false
}

const Link_ = withRouter(BaseLink);
Link_.displayName = 'Link';

const ExternalLink = React.forwardRef(({ to, ...rest }, ref) => {
  return React.createElement('a', { ...rest, href: to, ref })
})

let Link = function({
	instantBack,
	onClick,
  to,
	...rest
}, ref) {
	const onClickHandler = useCallback((event) => {
		if (onClick) {
			onClick(event)
		}
		if (event.defaultPrevented) {
			return
		}
		setInstantBackAbilityFlagForThisNavigation(instantBack)
	}, [
		instantBack,
		onClick
	])

  const isRelative = typeof to === 'string' ? isRelativeUrl(to) : isRelativeLocation(to)

	return React.createElement(
    isRelative ? Link_ : ExternalLink,
    {
      ref,
      ...rest,
      to,
      onClick: onClickHandler
    }
	)
}

Link = React.forwardRef(Link)

Link.propTypes = {
	instantBack: PropTypes.bool,
	onClick: PropTypes.func
}

export default Link

function isRelativeUrl(url) {
  return url && url[0] === '/' && url[1] !== '/'
}

function isRelativeLocation(location) {
  // return something like `location.origin === useLocation().origin`
  return true
}