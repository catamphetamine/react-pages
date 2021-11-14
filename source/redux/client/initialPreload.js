import React from 'react'
import ReactDOM from 'react-dom'

import { Loading } from '../../components/Loading'
import reactRender from '../../client/reactRender'

// In cases when the initial page immediately redirects
// to another page (for example, to a "not found" page),
// `node` and `ref` would get overwritten have they been
// simple variables and not arrays.
let nodes = []
let refs = []

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
	const node = document.createElement('div')
	nodes.push(node)
	// Will prepend `element` to `<body/>` (even if `<body/>` is empty).
	// https://stackoverflow.com/questions/2007357/how-to-set-dom-element-as-the-first-child
	document.body.insertBefore(node, document.body.firstChild)
	const setRef = (ref) => {
		const index = nodes.indexOf(node)
		if (index >= 0) {
			refs[index] = ref
		}
	}
	// `ReactDOM.createRoot` is available since React 18.
	reactRender(<LoadingContainer ref={setRef}/>, node)
}

export function hideInitialPreload() {
	const node = nodes.pop()
	const ref = refs.pop()
	ref.setState({ loading: false }, () => {
		setTimeout(() => {
			ReactDOM.unmountComponentAtNode(node)
			document.body.removeChild(node)
		}, 160)
	})
}