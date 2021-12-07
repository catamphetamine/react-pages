import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
// import Link_ from 'found/Link'
import { withRouter } from 'found';

import { markImmediateNavigationAsInstantBack } from './client/instantNavigation'

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
  activeClassName,
  activeStyle,
  activePropName,
  router,
  exact,
  ...props
}, ref) {
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

  return (
    <Component
    	ref={ref}
      {...props}
      href={href}
      onClick={onClick_}
    />
  )
}

BaseLink = React.forwardRef(BaseLink)

BaseLink.propTypes = {
  as: PropTypes.elementType.isRequired,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  match: PropTypes.object.isRequired,
  activeClassName: PropTypes.string,
  activeStyle: PropTypes.object,
  activePropName: PropTypes.string,
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

let Link = function({
	instantBack,
	onClick,
	...rest
}, ref) {
	const onClickHandler = useCallback((event) => {
		if (onClick) {
			onClick(event)
		}
		if (event.defaultPrevented) {
			return
		}
		markImmediateNavigationAsInstantBack(instantBack)
	}, [
		instantBack,
		onClick
	])

	return (
		<Link_ ref={ref} {...rest} onClick={onClickHandler}/>
	)
}

Link = React.forwardRef(Link)

Link.propTypes = {
	instantBack: PropTypes.bool,
	onClick: PropTypes.func
}

export default Link