import React from 'react'
import { Provider } from 'react-redux'

export default function Container({ store, children }) {
	return React.createElement(Provider, { store }, children)
}