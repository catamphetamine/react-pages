import React          from 'react'
import ReactDOM       from 'react-dom'
import ReactDOMServer from 'react-dom/server'

import { render_on_client as react_render_on_client, render_on_server as react_render_on_server } from '../render'

import { Router, match, RouterContext, browserHistory } from 'react-router'

// Renders `element` React element inside the `to` DOM element.
//
// returns a Promise resolving to the rendered React component.
//
export function render_on_client({ development, element, create_page_element, to })
{
  const router_element = <Router history={browserHistory} routes={create_routes()}/>

  return create_page_element(router_element).then(element =>
  {
    // render the wrapped React page element to DOM
    return react_render_on_client
    ({
      development, // development mode flag
      element,     // wrapped React page element
      to           // DOM element containing React markup
    })
  })
}

// returns a Promise resolving to { status, markup, redirect_to }
//
export function render_on_server({ disable_server_side_rendering, create_page_element, render_webpage_as_react_element, create_routes, url })
{
  // Maybe no one really needs to `disable_server_side_rendering`
  if (disable_server_side_rendering)
  {
    // Render the empty <Html/> component into Html markup string
    return Promise.resolve({ markup: react_render_on_server({ render_webpage_as_react_element }) })
  }

  // The following code hasn't been tested.
  // Should work.
  return new Promise((resolve, reject) =>
  {
    // perform React-router routing
    match({ routes: create_routes(), location: url }, (error, redirect_location, render_props) =>
    {
      // routing process failed
      if (error)
      {
        return reject(error)
      }
      
      // if a decision to perform a redirect was made 
      // during the routing process,
      // then redirect to another url
      if (redirect_location)
      {
        return resolve
        ({
          redirect_to: redirect_location.pathname + redirect_location.search
        })
      }

      // if the page was not found
      if (!render_props)
      {
        const error = new Error('Not found')
        error.status = 404
        return reject(error)
      }

      // Renders the current page React component to a React element
      // (`<ReduxRouter/>` is gonna get the matched route from the `store`)
      const page_element = create_page_element(<RouterContext {...render_props}/>)

      // Render the current page's React element to HTML markup
      const markup = react_render_on_server({ render_webpage_as_react_element, page_element })
      
      // return HTTP status code and HTML markup
      return { markup }
    })
  })
}