import React                 from 'react'
import ReactDOM              from 'react-dom'
import ReactDOMServer        from 'react-dom/server'

// returns React component (for the element that was rendered).
//
// renders directly to the "to" DOM element.
// (to allow for faster DOM mutations instead of simple slow Html code replacement)
export function client({ development, element, to })
{
	const component = ReactDOM.render(element, to)

	if (development)
	{
		window.React = React // enable debugger

		if (!to || !to.firstChild || !to.firstChild.attributes || !to.firstChild.attributes['data-react-checksum'])
		{
			console.error('Server-side React render was discarded. Make sure that your initial render does not contain any client-side code.')
		}
	}

	return component
}

// returns Html code.
export function server({ render_html })
{
	return '<!doctype html>\n' + ReactDOMServer.renderToString(render_html())
}