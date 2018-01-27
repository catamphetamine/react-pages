import nunjucks from 'nunjucks'

import { get_language_from_locale } from '../helpers'

nunjucks.configure({ autoescape: true })

export function render_before_content({
	assets,
	locale,
	meta,
	head,
	bodyStart
})
{
	return template_before_content.render
	({
		icon : assets.icon,
		style_urls : assets.entries.map(entry => assets.styles && assets.styles[entry]).filter(url => url),
		locale,
		meta,
		head,
		bodyStart,
		get_language_from_locale
	})
}

export function render_after_content({
	assets,
	hollow,
	locale,
	locale_messages_json,
	extension_javascript,
	protected_cookie_value,
	bodyEnd
})
{
	return template_after_content.render
	({
		javascript_urls : assets.entries.map(entry => assets.javascript && assets.javascript[entry]).filter(url => url),
		hollow,
		locale,
		locale_messages_json,
		extension_javascript,
		protected_cookie_value,
		bodyEnd,
		safe_json_stringify
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

const template_before_content = nunjucks.compile
(`
	<!doctype html>
	<html>
		<head>
			{# <title/> and <meta/> tags, properly escaped #}
			{{ meta | safe }}

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
			{% if icon %}
				<link rel="shortcut icon" href="{{ icon | safe }}"/>
			{% endif %}
		</head>

		<body>
			{# Supports adding arbitrary markup to <body/> start #}
			{{ bodyStart | safe }}

			{# 
				React page content.
				(most of the possible XSS attack scripts are executed here,
				 before the global protected cookie value variable is set,
				 so they're unlikely to even be able to hijack it)
			#}
			<div id="react">`
.replace(/\t/g, ''))

const template_after_content = nunjucks.compile
(`</div>

			{#
				Server-Side Rendering "hollow" flag.
				It is used to determine whether to call
				"ReactDOM.hydrate()" or "ReactDOM.render()".
			#}
			<script>
				window._server_side_render = true
				{% if hollow %}
					window._hollow_server_side_render = true
				{% endif %}
			</script>

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
				Make protected cookie value visible to the client-side code
				to set up the "http" utility used inside Redux actions.
				(the client-side React initialization code will
				 automatically erase this protected cookie value global variable
				 to protect the user from session hijacking via an XSS attack)
			#}
			{% if protected_cookie_value %}
				<script data-protected-cookie>
					window._protected_cookie_value={{ safe_json_stringify(protected_cookie_value) | safe }}
				</script>
			{% endif %}

			{#
				Remove the <script/> tag above as soon as it executes
				to prevent potentially exposing protected cookie value during an XSS attack.
			#}
			{% if protected_cookie_value %}
				<script>
					document.body.removeChild(document.querySelector('script[data-protected-cookie]'))
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
			{{ bodyEnd | safe }}
		</body>
	</html>
`
.replace(/\t/g, ''))