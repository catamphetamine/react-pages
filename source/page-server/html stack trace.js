import path from 'path'

export default function render_stack_trace(error)
{
	// supports custom `html` for an error
	if (error.html)
	{
		return { response_status: error.code, response_body: error.html }
	}

	// handle `superagent` errors: if an error response was an html, then just render it
	// https://github.com/visionmedia/superagent/blob/29ca1fc938b974c6623d9040a044e39dfb272fed/lib/node/response.js#L106
	if (typeof error.status === 'number')
	{
		// if the `superagent` http request returned an html response 
		// (possibly an error stack trace),
		// then just output that stack trace
		if (error.response 
			&& error.response.headers['content-type']
			&& error.response.headers['content-type'].split(';')[0].trim() === 'text/html')
		{
			return { response_status: error.status, response_body: error.message }
		}
	}

	// if this error has a stack trace then it can be shown

	let stack_trace

	if (error.stack)
	{
		stack_trace = error.stack
	}
	// `superagent` errors have the `original` property 
	// for storing the initial error
	else if (error.original && error.original.stack)
	{
		stack_trace = error.original.stack
	}

	// if this error doesn't have a stack trace - do nothing
	if (!stack_trace)
	{
		return {}
	}

	try
	{
		return { response_body: html_stack_trace(stack_trace) }
	}
	catch (error)
	{
		console.error(error)
		return { response_status: 500, response_body: error.stack }
	}
}

export function html_stack_trace(stack_trace)
{
	const lines = stack_trace.split('\n').map(line => line.trim())
	const groups = []
	let group

	for (let line of lines)
	{
		if (!line.starts_with('at'))
		{
			line = line.replace(/^Error: /, '')

			group = { title: line, lines: [] }
			groups.push(group)
		}
		else
		{
			line = line.replace(/at /, '')

			const line_parts = line.match(/^(.*) \((.*):(\d+):(\d+)\)$/)

			if (line_parts)
			{
				const method_path      = line_parts[1]
				const file_path        = line_parts[2]
				const file_line_number = line_parts[3]

				line = 
				`
					<span class="file-path">${escape_html(path.basename(file_path))}</span><!--
					--><span class="colon">:</span><!--
					--><span class="line-number">${file_line_number}</span>
					<span class="method">${escape_html(method_path)}</span>
				`
			}
			else
			{
				const line_parts_fallback = line.match(/^(.*) \((.*)\)$/)

				if (line_parts_fallback)
				{
					const method_path = line_parts_fallback[1]
					const file_path   = line_parts_fallback[2]

					if (file_path === 'native')
					{
						line = 
						`
							<span class="method">${escape_html(method_path)}</span>
						`
					}
					else
					{
						line = 
						`
							<span class="file-path">${escape_html(path.basename(file_path))}</span>
							<span class="method">${escape_html(method_path)}</span>
						`
					}
				}
			}

			group.lines.push(line)
		}
	}

	const groups_markup = groups.map(group =>
	{
		const markup =
		`
			<h1>${escape_html(group.title)}</h1>
			<ul>${group.lines.map(line => '<li>' + line + '</li>').join('')}</ul>
		`

		return markup
	})
	.join('')

	const html =
	`
		<html>
			<head>
				<title>Error</title>

				<style>
					body
					{
						margin-top    : 1.6em;
						margin-bottom : 1.6em;

						margin-left   : 2.3em;
						margin-right  : 2.3em;

						font-family : Monospace, Arial;
						font-size   : 20pt;
					}

					ul li 
					{
						margin-bottom   : 1em;
						list-style-type : none;
					}

					.file-path
					{
						font-weight: bold;
					}

					.line-number
					{

					}

					.colon
					{
						color: #9f9f9f;
					}

					.method
					{
						color: #0091C2;
						font-weight: bold;
					}
				</style>
			</head>

			<body>
				${groups_markup}
			</body>
		</html>
	`

	return html
}

function escape_html(text)
{
	return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
