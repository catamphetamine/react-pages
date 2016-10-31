import React, { Component, PropTypes } from 'react'
import ReactDOMServer from 'react-dom/server'

import { server_generated_webpage_head } from '../webpage head'
import { get_language_from_locale } from '../helpers'

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
			authentication_token
		}
		= this.props

		const content_markup = this.props.children ? ReactDOMServer.renderToString(this.props.children) : ''

		let content_element = <div id="react" dangerouslySetInnerHTML={{ __html: content_markup }}/>

		if (body)
		{
			content_element = body(content_element)
		}

		const webpage_head = server_generated_webpage_head()

		let html_attributes = webpage_head.htmlAttributes.toComponent()

		// Fixing `react-helmet` bug here
		// until they release the fix
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

					{/* (will be done only in development mode)

					    resolves the initial style flash (flicker) 
					    on page load in development mode 
					    (caused by Webpack style-loader mounting CSS styles 
					     through javascript after page load)
					    by mounting the entire CSS stylesheet in a <style/> tag */}
					{ development && style && <style dangerouslySetInnerHTML={{__html: style()}} charSet="UTF-8"/> }

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

					{/* locale for international messages */}
					{ locale && <script dangerouslySetInnerHTML={{__html: `window._locale=${JSON.stringify(locale)}`}} charSet="UTF-8"/> }

					{/* JSON Date deserializer */}
					{ parse_dates !== false && <script dangerouslySetInnerHTML={{__html: define_json_parser}} charSet="UTF-8"/> }

					{/* Flux store data will be reloaded into the store on the client-side */}
					<script dangerouslySetInnerHTML={{__html: `window._flux_store_data=JSON.parse(${JSON.stringify(JSON.stringify(store_state))}${parse_dates !== false ? ', JSON.date_parser' : ''})`}} charSet="UTF-8"/>

					{/* javascripts */}

					{/* Make JWT authentication token visible to the client-side code
					    to set up the `http` utility used inside Redux actions.
					    (the client-side React initialization code will
					     automatically erase this authenticaiton token global variable
					     to protect the user from session hijacking via an XSS attack) */}
					{ authentication_token && <script data-authentication-token dangerouslySetInnerHTML={{__html: `window._authentication_token=${JSON.stringify(authentication_token)}`}} charSet="UTF-8"/> }
					{/* Remove the <script/> tag above as soon as it executes
					    to prevent potentially exposing authentication token during an XSS attack */}
					{ authentication_token && <script dangerouslySetInnerHTML={{__html: `document.body.removeChild(document.querySelector('script[data-authentication-token]'))`}} charSet="UTF-8"/> }

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
	var ISO = /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2}(?:\\.\\d*))(?:Z|(\\+|-)([\\d|:]*))?$/;

	JSON.date_parser = function(key, value)
	{
		if (typeof value === 'string' && ISO.test(value))
		{
			return new Date(value)
		}

		return value
	}
}
`