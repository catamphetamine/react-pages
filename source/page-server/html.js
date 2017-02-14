import nunjucks from 'nunjucks'

import { server_side_generated_webpage_head } from '../webpage head'
import { get_language_from_locale } from '../helpers'

nunjucks.configure({ autoescape: true })

export default function Html(options)
{
	const { assets } = options

	const style_urls = []
	const javascript_urls = []

	for (const entry of assets.entries)
	{
		if (assets.styles && assets.styles[entry])
		{
			style_urls.push(assets.styles[entry])
		}

		if (assets.javascript && assets.javascript[entry])
		{
			javascript_urls.push(assets.javascript[entry])
		}
	}

	const webpage_head = server_side_generated_webpage_head()

	return template.render
	({
		...options,
		webpage_head,
		style_urls,
		javascript_urls,
		get_language_from_locale,
		safe_json_stringify,
		JSON
	})
}

export function safe_json_stringify(json)
{
	// The default javascript JSON.stringify doesn't escape forward slashes,
	// but it is allowed by the JSON specification, so we manually do it here.
	// (and javascript regular expressions don't support "negative lookbehind"
	//  so it's simply replacing all forward slashes with escaped ones,
	//  but also make sure to not call it twice on the same JSON)
	return JSON.stringify(json).replace(/\//g, '\\/')
}

const template = nunjucks.compile
(`
	<html {{ webpage_head.htmlAttributes.toString() }} {% if locale %} lang="{{get_language_from_locale(locale)}}" {% endif %}>
		<head>
			{# "react-helmet" stuff #}
			{{ webpage_head.title.toString() | safe }}
			{{ webpage_head.meta.toString()  | safe }}
			{{ webpage_head.link.toString()  | safe }}

			{#
				(will be done only in production mode
				 with webpack extract text plugin) 
				Mount CSS stylesheets for all entry points (e.g. "main")
			#}
			{% for style_url in style_urls %}
				<link
					href="{{ style_url | safe }}"
					rel="stylesheet"
					type="text/css"
					charset="UTF-8"/>
			{% endfor %}

			{# Custom <head/> markup #}
			{{ head | safe }}

			{# Site icon #}
			{% if assets.icon %}
				<link rel="shortcut icon" href="{{ assets.icon | safe }}"/>
			{% endif %}
		</head>

		<body>
			{# Supports adding arbitrary markup to <body/> start #}
			{{ body_start | safe }}

			{# 
				React page content.
				(most of the possible XSS attack scripts are executed here,
				 before the global authentication token variable is set,
				 so they're unlikely to even be able to hijack it)
			#}
			<div id="react">
				{{- content | safe -}}
			</div>

			{#
				Locale for international messages
				(is only used in client-side Ajax "translate"
				 the existence of which is questionable).
			#}
			{% if locale %}
				<script>
					window._locale = {{ safe_json_stringify(locale) | safe }}
				</script>
			{% endif %}

			{#
				Localized messages.
				The value must be XSS-safe.
			#}
			{% if locale %}
				<script>
					window._locale_messages = {{ locale_messages_json | safe }}
				</script>
			{% endif %}

			{# Custom javascript. Must be XSS-safe. #}
			{# e.g. Redux stuff goes here (Redux state, Date parser) #}
			{% if extension_javascript %}
				{{ extension_javascript | safe }}
			{% endif %}

			{# javascripts #}

			{#
				Make JWT authentication token visible to the client-side code
				to set up the "http" utility used inside Redux actions.
				(the client-side React initialization code will
				 automatically erase this authenticaiton token global variable
				 to protect the user from session hijacking via an XSS attack)
			#}
			{% if authentication_token %}
				<script data-authentication-token>
					window._authentication_token={{ safe_json_stringify(authentication_token) | safe }}
				</script>
			{% endif %}

			{#
				Remove the <script/> tag above as soon as it executes
				to prevent potentially exposing authentication token during an XSS attack.
			#}
			{% if authentication_token %}
				<script>
					document.body.removeChild(document.querySelector('script[data-authentication-token]'))
				</script>
			{% endif %}

			{#
				Include all required "entry" points javascript
				(e.g. "common", "main")
			#}
			{% for javascript_url in javascript_urls %}
				<script src="{{ javascript_url | safe }}" charset="UTF-8"></script>
			{% endfor %}

			{# Supports adding arbitrary markup to <body/> end #}
			{{ body_end | safe }}
		</body>
	</html>
`
.replace(/\t/g, ''))