import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

// This component is not used.
function RemountOnNavigate(props) {
	const loading = useSelector(state => state.preload.pending)
	const location = useLocation()
	return (
		<div
			{...props}
			key={`${location.pathname}${location.search}`}>
			{children}
		</div>
	)
}