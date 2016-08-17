import { html as html_stack_trace } from 'print-error'

export default function render_stack_trace(error, options)
{
	// Supports custom `html` for an error
	if (error.html)
	{
		return { response_status: error.status, response_body: error.html }
	}

	// Handle `superagent` errors: if an error response was an html, then just render it
	// https://github.com/visionmedia/superagent/blob/29ca1fc938b974c6623d9040a044e39dfb272fed/lib/node/response.js#L106
	if (typeof error.status === 'number')
	{
		// If the `superagent` http request returned an html response 
		// (possibly an error stack trace),
		// then just output that stack trace
		if (error.response 
			&& error.response.headers['content-type']
			&& error.response.headers['content-type'].split(';')[0].trim() === 'text/html')
		{
			return { response_status: error.status, response_body: error.message }
		}
	}

	// If this error has a stack trace then it can be shown

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

	// If this error doesn't have a stack trace - do nothing
	if (!stack_trace)
	{
		return {}
	}

	try
	{
		return { response_body: html_stack_trace({ stack: stack_trace }, options) }
	}
	catch (error)
	{
		console.error(error)
		return { response_status: 500, response_body: error.stack }
	}
}