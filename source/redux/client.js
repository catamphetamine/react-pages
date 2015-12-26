import { client } from './render'
import dev_tools  from './dev tools'
import { exists } from '../helpers'

export default function({ development, development_tools, to, create_store, create_routes, markup_wrapper })
{
	// international

	const language = document.documentElement.getAttribute('lang')

	const localized_messages = window._localized_messages

	if (localized_messages)
	{
		delete window._localized_messages
	}

	// create Redux store
	const store = create_store({ data: window._flux_store_data, create_routes })
	delete window._flux_store_data

	// render page (on the client side)
	client
	({
		development,
		markup_wrapper : (component, options) =>
		{
			// international
			if (localized_messages)
			{
				options.locale   = language
				options.messages = localized_messages
			}

			const wrapped_component = markup_wrapper(component, options)

			if (!development_tools)
			{
				return wrapped_component
			}

			// Render dev tools after initial client render to prevent warning
			// "React attempted to reuse markup in a container but the checksum was invalid"
			// https://github.com/erikras/react-redux-universal-hot-example/pull/210

			ReactDOM.render(wrapped_component, content_container)

			console.log(`You are gonna see a warning about "React.findDOMNode is deprecated" in the console. It's normal: redux_devtools hasn't been updated to React 0.14 yet`)

			const markup =
			(
				<div>
					{wrapped_component}
					<dev_tools/>
				</div>
			)

			return markup
		},
		create_routes,
		store,
		to
	})
}