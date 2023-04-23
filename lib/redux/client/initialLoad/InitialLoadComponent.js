import React from 'react'
import PropTypes from 'prop-types'

import { Loading } from '../../../components/Loading.js'

// This component is currently not used.
export default function InitialLoadComponent({ show, hideAnimationDuration }) {
	return React.createElement(Loading, {
		initial: show,
		// immediate: show,
		immediate: false,
		pending: show,
		fadeOutDuration: hideAnimationDuration
	})
}

InitialLoadComponent.propTypes = {
	show: PropTypes.bool.isRequired,
	hideAnimationDuration: PropTypes.number.isRequired
}