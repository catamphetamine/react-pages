import nunjucks from 'nunjucks'

nunjucks.configure({ autoescape: true })

export function renderBeforeContent({
	assets,
	meta,
	head,
	bodyStart
})
{
	return TEMPLATE_BEFORE_CONTENT.render
	({
		icon : assets.icon,
		style_urls : assets.entries.map(entry => assets.styles && assets.styles[entry]).filter(url => url),
		meta,
		head,
		bodyStart
	})
}

export function renderAfterContent({
	assets,
	contentNotRendered,
	locales,
	javascript,
	protected_cookie_value,
	bodyEnd
})
{
	return TEMPLATE_AFTER_CONTENT.render
	({
		javascript_urls : assets.entries.map(entry => assets.javascript && assets.javascript[entry]).filter(url => url),
		contentNotRendered,
		locales,
		javascript,
		protected_cookie_value,
		bodyEnd,
		safeJsonStringify
	})
}

export function safeJsonStringify(json)
{
	// The default javascript JSON.stringify doesn't escape forward slashes,
	// but it is allowed by the JSON specification, so we manually do it here.
	// (and javascript regular expressions don't support "negative lookbehind"
	//  so it's simply replacing all forward slashes with escaped ones,
	//  but also make sure to not call it twice on the same JSON)
	return JSON.stringify(json).replace(/\//g, '\\/')
}

const TEMPLATE_BEFORE_CONTENT = nunjucks.compile
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
			<div id="react" class="react--loading">`
.replace(/\t/g, ''))

const TEMPLATE_AFTER_CONTENT = nunjucks.compile
(`</div>

			{#
				Server-Side Rendering "renderContent" flag.
				It is used to determine whether to call
				"ReactDOM.hydrate()" or "ReactDOM.render()".
			#}
			<script>
				window._server_side_render = true
				{% if contentNotRendered %}
					window._empty_server_side_render = true
				{% endif %}
			</script>

			{#
				Locale for international messages
				(is only used in client-side Ajax "translate"
				 the existence of which is questionable).
			#}
			{% if locales %}
				<script>
					window._react_website_locales = {{ safeJsonStringify(locales) | safe }}
				</script>
			{% endif %}

			{# Custom javascript. Must be XSS-safe. #}
			{# e.g. Redux stuff goes here (Redux state, Date parser) #}
			{% if javascript %}
				{{ javascript | safe }}
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
					window._protected_cookie_value={{ safeJsonStringify(protected_cookie_value) | safe }}
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