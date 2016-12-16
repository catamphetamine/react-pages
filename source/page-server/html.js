import React, { Component, PropTypes } from 'react'
import ReactDOMServer from 'react-dom/server'

import { server_generated_webpage_head } from '../webpage head'
import { get_language_from_locale } from '../helpers'
import { ISO_date_regexp } from '../date parser'

/**
 * Wrapper component containing HTML metadata and boilerplate tags.
 * Used in server-side code only to wrap the string output of the
 * rendered route component.
 *
 * The only thing this component doesn't (and can't) include is the
 * HTML doctype declaration, which is added to the rendered output
 * by the server.js file.
 */
export default class Html extends Component
{
	static propTypes =
	{
		development : PropTypes.bool,
		assets      : PropTypes.object.isRequired,
		store       : PropTypes.object.isRequired,
		children    : PropTypes.node,
		head        : PropTypes.node,
		body        : PropTypes.func,
		body_start  : PropTypes.node,
		body_end    : PropTypes.node,
		parse_dates : PropTypes.bool,
		style       : PropTypes.func,
		locale      : PropTypes.string,
		locale_messages_json : PropTypes.string,

		authentication_token : PropTypes.string
	}

	render()
	{
		const
		{
			development,
			assets,
			store,
			head,
			body,
			body_start,
			body_end,
			parse_dates,
			style,
			locale,
			locale_messages_json,
			authentication_token
		}
		= this.props

		const content_markup = this.props.children ? ReactDOMServer.renderToString(this.props.children) : ''

		{/* Using `dangerouslySetInnerHTML` here to prevent React from escaping the HTML markup */}
		let content_element = <div id="react" dangerouslySetInnerHTML={{ __html: content_markup }}/>

		if (body)
		{
			content_element = body(content_element)
		}

		const webpage_head = server_generated_webpage_head()

		let html_attributes = webpage_head.htmlAttributes.toComponent()

		// Fixing `react-helmet` bug here (they've fixed it in `3.2.3`)
		// https://github.com/nfl/react-helmet/issues/158
		if (Array.isArray(html_attributes))
		{
			// A workaround
			html_attributes = {}

			// console.log(`You're gonna see a React warning in the console:` + `\n` +
			// 	`"Warning: React.createElement(...): Expected props argument of html to be a plain object".` + `\n` +
			// 	`This is not an error and this warning will be fixed in "react-helmet" package` + `\n` +
			// 	`https://github.com/nfl/react-helmet/issues/158` + `\n` + `\n` +
			// 	`This error happens when there's no page content to render ("content" is undefined in Html.js)`)
		}

		// Set `<html lang="...">` if specified
		if (locale)
		{
			html_attributes.lang = get_language_from_locale(locale)
		}

		const style_url      = assets.entry ? assets.style[assets.entry]      : assets.style
		const javascript_url = assets.entry ? assets.javascript[assets.entry] : assets.javascript

		const store_state = store.getState()
		// Remove `redux-router` data from store
		delete store_state.router

		const html = 
		(
			<html {...html_attributes}>
				<head>
					{/* webpage title and various meta tags */}
					{webpage_head.title.toComponent()}
					{webpage_head.meta.toComponent()}
					{webpage_head.link.toComponent()}

					{/* (will be done only in production mode
					     with webpack extract text plugin) 

					    mount CSS stylesheets for all entry points
					    (should have been "for the current entry point only")

					    (currently there is only one entry point: "main";
					     and also the "common" chunk) */}

					{ assets.entry && assets.style && assets.style.common &&
						<link 
							href={assets.style.common} 
							rel="stylesheet" 
							type="text/css"
							charSet="UTF-8"/>
					}

					{ style_url &&
						<link 
							href={style_url} 
							rel="stylesheet" 
							type="text/css"
							charSet="UTF-8"/>
					}

					{ head }

					{ assets.icon && <link rel="shortcut icon" href={assets.icon}/> }
				</head>

				<body>
					{/* support adding arbitrary markup to body start */}
					{ body_start }

					{/* React page content */}
					{/* (most of the possible XSS attack scripts are executed here,
					     before the global authentication token variable is set,
					     so they're unlikely to even be able to hijack it) */}
					{ content_element }

					{/* Locale for international messages (maybe could be removed). */}
					{/* Using `dangerouslySetInnerHTML` here to prevent React from escaping
					    "potentially dangerous" characters, e.g. double qoutes. */}
					{/* The value is considered XSS-safe. */}
					{ locale && <script charSet="UTF-8" dangerouslySetInnerHTML={{__html: `window._locale=${JSON.stringify(locale)}`}}/> }

					{/* Localized messages. */}
					{/* Using `dangerouslySetInnerHTML` here to prevent React from escaping
					    "potentially dangerous" characters, e.g. double qoutes. */}
					{/* The value is considered XSS-safe. */}
					{ locale && <script charSet="UTF-8" dangerouslySetInnerHTML={{__html: `window._locale_messages=${locale_messages_json}`}}/> }

					{/* JSON Date deserializer */}
					{ parse_dates !== false && <script dangerouslySetInnerHTML={{__html: define_json_parser}} charSet="UTF-8"/> }

					{/* Flux store data will be reloaded into the store on the client-side. */}
					{/* Using `dangerouslySetInnerHTML` here to prevent React from escaping "potentially dangerous" characters */}
					{/* At the same time all forward slashes are escaped to prevent XSS attacks.
					    https://medium.com/node-security/the-most-common-xss-vulnerability-in-react-js-applications-2bdffbcc1fa0#.8dhdig4us */}
					<script dangerouslySetInnerHTML={{__html: `window._flux_store_data=JSON.parse(${JSON.stringify(safe_json_stringify(store_state))}${parse_dates !== false ? ', JSON.date_parser' : ''})`}} charSet="UTF-8"/>

					{/* javascripts */}

					{/* Make JWT authentication token visible to the client-side code
					    to set up the `http` utility used inside Redux actions.
					    (the client-side React initialization code will
					     automatically erase this authenticaiton token global variable
					     to protect the user from session hijacking via an XSS attack) */}
					{/* The value is considered XSS-safe. */}
					{ authentication_token && <script charSet="UTF-8" data-authentication-token dangerouslySetInnerHTML={{__html: `window._authentication_token=${JSON.stringify(authentication_token)}`}}/> }
					{/* Remove the <script/> tag above as soon as it executes
					    to prevent potentially exposing authentication token during an XSS attack */}
					{/* The value is XSS-safe. */}
					{ authentication_token && <script charSet="UTF-8" dangerouslySetInnerHTML={{__html: `document.body.removeChild(document.querySelector('script[data-authentication-token]'))`}}/> }

					{/* the "common.js" chunk (see webpack extract commons plugin) */}
					{/* (needs to be included first (by design)) */}
					{ (assets.entry && assets.javascript && assets.javascript.common) && <script src={assets.javascript.common} charSet="UTF-8"/> }

					{/* current application "entry" point javascript
					    (currently there is only one entry point: "main") */}
					<script src={ javascript_url } charSet="UTF-8"/>

					{/* support adding arbitrary markup to body end */}
					{ body_end }
				</body>
			</html>
		)

		return html
	}
}

// JSON date deserializer
// use as the second, 'reviver' argument to JSON.parse(json, JSON.date_parser);
//
// http://stackoverflow.com/questions/14488745/javascript-json-date-deserialization/23691273#23691273
//
const define_json_parser =
`
if (!JSON.date_parser)
{
	JSON.date_parser = function(key, value)
	{
		if (typeof value === 'string' && /^${ISO_date_regexp}$/.test(value))
		{
			return new Date(value)
		}

		return value
	}
}
`

function safe_json_stringify(json)
{
	// The default javascript JSON.stringify doesn't escape forward slashes,
	// but it is allowed by the JSON specification, so we manually do it here.
	// (and javascript regular expressions don't support "negative lookbehind"
	//  so it's simply replacing all forward slashes with escaped ones,
	//  but also make sure to not call it twice on the same JSON)
	return JSON.stringify(json).replace(/\//g, '\\/')
}