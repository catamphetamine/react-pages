import React, { Component } from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'

import { getDisplayName } from '../../utility'

export const TRANSLATE_LOCALES_PROPERTY  = '__translation__'

// Hasn't been tested.
// Is a "proof-of-concept".
export default function translate(locales)
{
	return function(DecoratedComponent)
	{
		class TranslatedComponent extends Component {
			render() {
				return <DecoratedComponent {...this.props} />
			}
		}

		TranslatedComponent[TRANSLATE_LOCALES_PROPERTY] = locales

		// Component naming for React DevTools
		TranslatedComponent.displayName = `Translate(${getDisplayName(DecoratedComponent)})`

		// Keep all non-React-specific static methods
		return hoistNonReactStatics(TranslatedComponent, DecoratedComponent)
	}
}