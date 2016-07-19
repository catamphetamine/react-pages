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
		content     : PropTypes.node,
		store       : PropTypes.object.isRequired,
		head        : PropTypes.func,
		body        : PropTypes.func,
		body_start  : PropTypes.func,
		body_end    : PropTypes.func,
		style       : PropTypes.func,
		locale      : PropTypes.string
	}

	render()
	{
		const { development, assets, store, head, body, body_start, body_end, style, locale } = this.props

		// when server-side rendering is disabled, content will be undefined
		// (but server-side rendering is always enabled so this "if" condition may be removed)
		let content_markup = this.props.children ? ReactDOMServer.renderToString(this.props.children) : ''

		let content_element = <div id="react" dangerouslySetInnerHTML={{__html: content_markup}}/>

		if (body)
		{
			content_element = body(content_element)
		}

		const webpage_head = server_generated_webpage_head()

		const html_attributes = webpage_head.htmlAttributes.toComponent()

		if (locale)
		{
			html_attributes.lang = get_language_from_locale(locale)
		}

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

					{ assets.style &&
						<link 
							href={assets.entry ? assets.style[assets.entry] : assets.style} 
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
					{ development && style ? <style dangerouslySetInnerHTML={{__html: style()}} charSet="UTF-8"/> : null }

					{ head ? head() : null }

					{ assets.icon ? <link rel="shortcut icon" href={assets.icon}/> : null }
				</head>

				<body>
					{/* support adding arbitrary markup to body start */}
					{ body_start ? body_start() : null }

					{/* React page content */}
					{content_element}

					{/* locale for international messages */}
					{ locale && <script dangerouslySetInnerHTML={{__html: `window._locale=${JSON.stringify(locale)}`}} charSet="UTF-8"/> }

					{/* JSON Date deserializer */}
					<script dangerouslySetInnerHTML={{__html: define_json_parser}} charSet="UTF-8"/>

					{/* Flux store data will be reloaded into the store on the client */}
					<script dangerouslySetInnerHTML={{__html: `window._flux_store_data=JSON.parse(${JSON.stringify(JSON.stringify(store.getState()))}, JSON.date_parser)`}} charSet="UTF-8"/>

					{/* javascripts */}

					{/* the "common.js" chunk (see webpack extract commons plugin) */}
					{/* (needs to be included first (by design)) */}
					{ (assets.entry && assets.javascript && assets.javascript.common) ? <script src={assets.javascript.common} charSet="UTF-8"/> : null }
					
					{/* current application "entry" point javascript
					    (currently there is only one entry point: "main") */}
					<script src={ assets.entry ? assets.javascript[assets.entry] : assets.javascript } charSet="UTF-8"/>

					{/* support adding arbitrary markup to body end */}
					{ body_end ? body_end() : null }
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