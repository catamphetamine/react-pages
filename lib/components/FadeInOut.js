import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

export default class FadeInOut extends React.Component {
	static propTypes = {
		show: PropTypes.bool.isRequired,
		hiddenClassName: PropTypes.string,
		fadeOutDuration: PropTypes.number.isRequired,
		fadeInClassName: PropTypes.string,
		children: PropTypes.node.isRequired
	}

	static defaultProps = {
		show: false
	}

	state = {
		show: this.props.show
	}

	componentDidUpdate(prevProps)
	{
		if (!prevProps.show && this.props.show) {
			this.show()
		} else if (prevProps.show && !this.props.show) {
			this.hide()
		}
	}

	componentDidMount()
	{
		this._isMounted = true
	}

	componentWillUnmount()
	{
		this._isMounted = false

		clearTimeout(this.showTimer)
		clearTimeout(this.hideTimer)
	}

	show()
	{
		clearTimeout(this.showTimer)
		clearTimeout(this.hideTimer)

		this.setState
		({
			show : true,
			fadeIn : false,
			fadeOut : false
		})

		this.showTimer = setTimeout(() =>
		{
			if (this._isMounted) {
				this.setState({
					fadeIn: true
				})
			}
		},
		// Adding a non-null delay in order to
		// prevent web browser from optimizing
		// adding CSS classes and doing it simultaneously
		// rather than sequentially (required for CSS transition).
		10)
	}

	hide = () =>
	{
		const { fadeOutDuration } = this.props

		clearTimeout(this.showTimer)

		if (!this._isMounted) {
			return
		}

		this.setState
		({
			show : false,
			fadeIn : false,
			fadeOut : true
		})

		// Gives some time to CSS opacity transition to finish.
		this.hideTimer = setTimeout(() =>
		{
			if (this._isMounted) {
				this.setState({
					fadeOut : false
				})
			}
		},
		fadeOutDuration)
	}

	render() {
		const {
			fadeInClassName,
			hiddenClassName,
			children
		} = this.props

		const {
			show,
			fadeIn,
			fadeOut
		} = this.state

		if (show || fadeOut) {
			if (fadeInClassName) {
				return React.cloneElement(children, {
					className: classNames(children.props.className, {
						[fadeInClassName]: fadeIn
					})
				})
			}
			return children
		}

		if (hiddenClassName) {
			return React.cloneElement(children, {
				className: classNames(children.props.className, hiddenClassName)
			})
		}

		return null
	}
}