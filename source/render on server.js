import ReactDOMServer from 'react-dom/server'

// Renders React page content element
// (wrapping it with the <Html/> component)
// to the resulting Html markup code
// (returns a string containing the final html markup)
//
export default function render_on_server({ render_webpage_as_react_element, page_element })
{
	return '<!doctype html>\n' + ReactDOMServer.renderToString(render_webpage_as_react_element(page_element))
}