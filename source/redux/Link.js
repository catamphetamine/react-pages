import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import Link from 'found/Link'

import { markImmediateNavigationAsInstantBack } from './client/instantNavigation'

let HyperLink = function({ instantBack, onClick, ...rest }, ref) {
	const onClickHandler = useCallback((event) => {
		if (onClick) {
			onClick(event)
		}
		if (event.defaultPrevented) {
			return
		}
		markImmediateNavigationAsInstantBack(instantBack)
	}, [instantBack, onClick])
	return (
		<Link ref={ref} {...rest} onClick={onClickHandler}/>
	)
}

HyperLink = React.forwardRef(HyperLink)

HyperLink.propTypes = {
	instantBack: PropTypes.bool,
	onClick: PropTypes.func
}

export default HyperLink
