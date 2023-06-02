import React from 'react'
import { Provider } from 'react-redux'

export default function DefaultRootComponent({ store, children }) {
	return React.createElement(Provider, { store }, children)
}