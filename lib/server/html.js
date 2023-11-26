import nunjucks from 'nunjucks'

nunjucks.configure({ autoescape: true })

export function renderBeforeContent({
	assets,
	locale,
	meta,
	head,
	bodyStart
})
{
	return TEMPLATE_BEFORE_CONTENT.render
	({
		icon: assets.icon,
		stylesheetUrls: assets.entries.map(entry => assets.styles && assets.styles[entry]).filter(url => url),
		locale,
		meta,
		head,
		bodyStart
	})
}

export function renderAfterContent({
	assets,
	serverSideRender,
	contentNotRendered,
	locales,
	javascript,
	bodyEnd
})
{
	return TEMPLATE_AFTER_CONTENT.render
	({
		javascriptUrls: assets.entries.map(entry => assets.javascript && assets.javascript[entry]).filter(url => url),
		serverSideRender,
		contentNotRendered,
		locales,
		javascript,
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
	<html {% if locale %} lang="{{locale}}" {% endif %}>
		<head>
			{# <title/> and <meta/> tags, properly escaped #}
			{{ meta | safe }}

			{#
				(will be done only in production mode
				 with webpack extract text plugin)
				Mount CSS stylesheets for all entry points (e.g. "main")
			#}
			{% for style_url in stylesheetUrls %}
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

			{# React page content. #}
			<div id="react" class="react--loading">`
.replace(/\t/g, ''))

const TEMPLATE_AFTER_CONTENT = nunjucks.compile
(`</div>

			{% if serverSideRender %}
				{#
					Server-Side Rendering "renderContent" flag.
					It is used to determine whether to call
					"ReactDOM.hydrate()" or "ReactDOM.render()".
				#}
				<script>
					{# If renaming this variable don't reset it in "./redux/client/setUpAndRender.js" #}
					window._ReactPages_ServerSideRendered = true
					{% if contentNotRendered %}
						{# If renaming this variable don't reset it in "./redux/client/setUpAndRender.js" #}
						window._ReactPages_ServerSideRenderedEmpty = true
					{% endif %}
				</script>

				{# User's preferred locales (based on the "Accept-Locale" HTTP request header). #}
				{% if locales %}
					<script>
						{# If renaming this variable don't reset it in "./redux/client/setUpAndRender.js" #}
						window._ReactPages_Locales = {{ safeJsonStringify(locales) | safe }}
					</script>
				{% endif %}

				{# Custom javascript. Must be XSS-safe. #}
				{# e.g. Redux stuff goes here (Redux state, Date parser) #}
				{% if javascript %}
					{{ javascript | safe }}
				{% endif %}
			{% endif %}

			{#
				Include all required "entry" points javascript
				(e.g. "common", "main")
			#}
			{% for javascript_url in javascriptUrls %}
				<script src="{{ javascript_url | safe }}" charset="UTF-8"></script>
			{% endfor %}

			{# Supports adding arbitrary markup to <body/> end #}
			{{ bodyEnd | safe }}
		</body>
	</html>
`
.replace(/\t/g, ''))