// http://codepen.io/jczimm/pen/vEBpoL

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const radius = 20
const padding = 0.25 // in `radius`es

const svg_circe_center = radius * (1 + padding)
const svg_canvas_dimensions = `0 0 ${svg_circe_center * 2} ${svg_circe_center * 2}`
// Whatever it is
// https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-miterlimit
const svg_stroke_miter_limit = radius / 2

export default function ActivityIndicator(props)
{
	const { className } = props

	return (
		<div
			{ ...props }
			className={ classNames('rrui__activity-indicator', className) }>
			<svg
				viewBox={ svg_canvas_dimensions }
				className="rrui__activity-indicator-circle-container">
				<circle
					className="rrui__activity-indicator-circle"
					cx={ svg_circe_center }
					cy={ svg_circe_center }
					r={ radius }
					fill="none"
					strokeWidth={ radius * 0.125 }
					strokeMiterlimit={ svg_stroke_miter_limit }/>
			</svg>
		</div>
	)
}

ActivityIndicator.propTypes =
{
	// CSS class
	className : PropTypes.string,

	// CSS style object
	style     : PropTypes.object
}