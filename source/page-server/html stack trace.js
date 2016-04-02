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

export function parse_stack_trace(stack_trace)
{
	const lines = stack_trace.split('\n').map(line => line.trim())
	const groups = []
	let group

	for (let line of lines)
	{
		if (line.indexOf('at') !== 0)
		{
			line = line.replace(/^Error: /, '')
			line = line.replace(/:$/, '')

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
				{
					file_path        : file_path,
					file_line_number : file_line_number,
					method_path      : method_path
				}
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
						{
							method_path : method_path
						}
					}
					else
					{

						line = 
						{
							file_path   : file_path,
							method_path : method_path
						}
					}
				}
				else
				{
					const line_parts_file_line_column = line.match(/^(.*):(\d+):(\d+)$/)

					if (line_parts_file_line_column)
					{
						const file_path        = line_parts_file_line_column[1]
						const file_line_number = line_parts_file_line_column[2]

						line = 
						{
							file_path        : file_path,
							file_line_number : file_line_number
						}
					}
				}
			}

			if (line.file_path)
			{
				line.file_name = basename(line.file_path)
				line.file_path = transform_file_path(line.file_path)
			}

			group.lines.push(line)
		}
	}

	return groups
}

export function html_stack_trace(error)
{
	const groups = parse_stack_trace(error)

	const groups_markup = groups.map((group, i) =>
	{
		const markup =
		`
			<h1 ${i === 0 ? '' : 'class="secondary"' }>${escape_html(group.title)}</h1>
			<ul>${group.lines.map(line => '<li>' + line_markup(line) + '</li>').join('')}</ul>
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
					html
					{
						font-family : Monospace, Arial;
						font-size   : 20pt;
					}

					body
					{
						margin-top    : 1.6em;
						margin-bottom : 1.6em;

						margin-left   : 2.3em;
						margin-right  : 2.3em;
					}

					h1
					{
						font-size : 1.4rem;
						color     : #C44100;
					}

					h1.secondary
					{
						font-weight : normal;
						color       : #7f7f7f;
					}

					ul
					{
						margin-top : 2em;
					}

					ul li 
					{
						margin-bottom   : 1.5em;
						list-style-type : none;
						font-size       : 1.2rem;
					}

					.file-path
					{
						color         : #7f7f7f;
						margin-top    : 0.8em;
						font-size     : 1rem;
					}

					.file-path-separator
					{
						color : #c0c0c0;
					}

					.file-name
					{
						font-weight : bold;
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

function line_markup(line_info)
{
	if (typeof line_info === 'string')
	{
		return line_info
	}

	let line = ''

	if (line_info.file_path)
	{
		line += `<span class="file-name">${line_info.file_name}</span>`
	}

	if (line_info.file_line_number)
	{
		line += `<span class="colon">:</span><span class="line-number">${line_info.file_line_number}</span>`
	}

	if (line_info.method_path)
	{
		if (line.length > 0)
		{
			line += ' '
		}

		line += `<span class="method">${escape_html(line_info.method_path)}</span>`
	}

	if (line_info.file_path)
	{	
		line += 
		`
			<div class="file-path">
				${escape_html(line_info.file_path).split('/').join('<span class="file-path-separator">/</span>')}
			</div>
		`
	}

	return line
}

function escape_html(text)
{
	return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function basename(path)
{
	let index = path.lastIndexOf('/')

	if (index >= 0)
	{
		return path.substring(index + 1)
	}

	index = path.lastIndexOf('\\')
	if (index >= 0)
	{
		return path.substring(index + 1)
	}

	return path
}

function transform_file_path(file_path)
{
	file_path = file_path.replace(/\\/g, '/')

	// replace "/node_modules/xxx/" with "/[xxx]/",
	// and also substitute project name
	const node_modules = file_path.indexOf('/node_modules/')
	if (node_modules >= 0)
	{
		const before = file_path.slice(0, node_modules).split('/')
		const rest = file_path.substring(node_modules + '/node_modules/'.length).split('/')
		const node_module = rest.shift()

		file_path = `[${before[before.length - 1]}]/[${node_module}]/${rest.join('/')}`
	}

	return file_path
}