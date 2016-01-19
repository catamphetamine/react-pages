import React from 'react'

import { client } from './render'
import dev_tools  from './dev tools'
import { exists } from '../helpers'

export default function({ development, development_tools, to, create_store, create_routes, markup_wrapper, load_localized_messages })
{
	// international

	const locale = window._locale

	if (locale)
	{
		delete window._locale
	}

	// create Redux store
	const store = create_store({ data: window._flux_store_data, create_routes })
	delete window._flux_store_data

	function render_react()
	{
		// returns a Promise for React component.
		//
		return client
		({
			development,
			render : (element, props) =>
			{
				return new Promise((resolve, reject) =>
				{
					// international
					if (locale)
					{
						if (!load_localized_messages)
						{
							throw new Error(`You are supposed to pass 
								"load_localized_messages(locale) => Promise" function 
								as a parameter to client-side rendering function call
								because you opted into using internationalization feature`)
						}

						load_localized_messages(locale).then(messages =>
						{
							props.locale   = locale
							props.messages = messages

							render()
						})
					}
					else
					{
						render()
					}

					function render()
					{
						let wrapped_element = React.createElement(markup_wrapper, props, element)

						if (!development_tools)
						{
							return resolve(wrapped_element)
						}

						// Render dev tools after initial client render to prevent warning
						// "React attempted to reuse markup in a container but the checksum was invalid"
						// https://github.com/erikras/react-redux-universal-hot-example/pull/210
						//
						// (practically does nothing)
						ReactDOM.render(wrapped_element, content_container)

						console.log(`You are gonna see a warning about "React.findDOMNode is deprecated" in the console. It's normal: redux_devtools hasn't been updated to React 0.14 yet`)

						resolve
						((
							<div>
								{wrapped_element}
								<dev_tools/>
							</div>
						))
					}
				})
			},
			create_routes,
			store,
			to: to || document.getElementById('react_markup')
		})
	}

	// render page (on the client side)
	//
	return render_react().then(component => ({ rerender: render_react }))
}