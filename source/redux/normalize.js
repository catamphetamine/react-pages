import { clone } from '../helpers'

export function normalize_common_options(common)
{
  if (!common)
  {
    throw new Error(`Common options weren't passed. Perhaps you've upgraded to react-isomorphic-render 4.0.0 in which case check the new API documentation.`)
  }

  common = clone(common)

  if (common.on_preload_error)
  {
    throw new Error(`"on_preload_error" has been renamed to "preload.on_error" in 5.x and to "preload.catch" in 6.x`)
  }

  if (!common.create_routes)
  {
    if (!common.routes)
    {
      throw new Error(`"routes" parameter is required`)
    }

    if (typeof common.routes === 'function')
    {
      common.create_routes = common.routes
    }
    else
    {
      const routes = common.routes
      common.create_routes = () => routes
    }

    delete common.routes
  }

  if (!common.get_reducer)
  {
    if (!common.reducer)
    {
      throw new Error(`"reducer" parameter is required`)
    }

    if (typeof common.reducer !== 'function')
    {
      const reducer = common.reducer
      common.reducer = () => reducer
    }

    common.get_reducer = common.reducer
    delete common.reducer
  }

  if (common.http_request)
  {
    console.log('WARNING: `http_request` common setting has been renamed to `http.request`')

    if (!common.http)
    {
      common.http = {}
    }

    common.http.request = common.http_request
    delete common.http_request
  }

  return common
}