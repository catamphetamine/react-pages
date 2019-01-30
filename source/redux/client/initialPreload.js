import React from 'react'
import ReactDOM from 'react-dom'

import { Loading } from '../../components/Loading'

let node
let ref

class LoadingContainer extends React.Component {
	state = {
		loading: true
	}
	render() {
		const { loading } = this.state
		return (
			<Loading
				initial={loading}
				immediate={loading}
				pending={loading}/>
		)
	}
}

export function showInitialPreload() {
	node = document.createElement('div')
	// Will prepend `element` to `<body/>` (even if `<body/>` is empty).
	// https://stackoverflow.com/questions/2007357/how-to-set-dom-element-as-the-first-child
	document.body.insertBefore(node, document.body.firstChild)
	ReactDOM.render(<LoadingContainer ref={_ => ref = _}/>, node)
}

export function hideInitialPreload() {
	ref.setState({ loading: false }, () => {
		setTimeout(() => document.body.removeChild(node), 1000)
	})
}