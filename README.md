# react-isomorphic-render

[![npm version](https://img.shields.io/npm/v/react-isomorphic-render.svg?style=flat-square)](https://www.npmjs.com/package/react-isomorphic-render)
[![npm downloads](https://img.shields.io/npm/dm/react-isomorphic-render.svg?style=flat-square)](https://www.npmjs.com/package/react-isomorphic-render)

Server Side Rendering for `React + React-router + Redux` stack.

 * Provides isomorphic HTTP client for calling REST API
 * Asynchronously preloads pages before performing navigation
 * Supports Webpack "hot reload"
 * Supports locale detection and app internationalization
 * Handles HTTP Cookies correctly

## Installation

```bash
$ npm install react-isomorphic-render --save
```

## Usage

(see [webapp](https://github.com/halt-hammerzeit/webapp) and [webpack-react-redux-isomorphic-render-example](https://github.com/halt-hammerzeit/webpack-react-redux-isomorphic-render-example) as references)

Start by creating your `react-isomorphic-render.js` set up file (it configures both client side and server side)

```javascript
export default
{
  // Redux reducer
  // (either a reducer or a function returning a reducer)
  reducer: require('./src/client/redux/reducer'),

  // React-router routes
  // (either a `<Route/>` element or a
  //  `function({ dispatch, getState })`
  //  returning a `<Route/>` element)
  routes: require('./src/client/routes'),
  
  // Wraps React page component with arbitrary elements
  // (e.g. Redux <Provider/>, and other "context providers")
  wrapper: require('./src/client/wrapper')
}
```

An example of a `wrapper` component:

```javascript
// Can be also a "React pure component" (i.e. a function)
export default class Wrapper extends React.Component
{
  render()
  {
    const { store, children } = this.props
    return <Provider store={store}>{children}</Provider>
  }
}
```

Then create your client-side application main file (`application.js`)

```javascript
import { render } from 'react-isomorphic-render/redux'
import settings from './react-isomorphic-render'

// Renders the page in web browser
render
({
  // enable/disable development mode
  development: true
},
settings)
```

And the `index.html` would look like this

```html
<html>
  <head>
    <title>react-isomorphic-render</title>
    <link rel="stylesheet" type="text/css" href="/style.css">
  </head>
  <body>
    <div id="react"></div>
    <script src="/application.js"></script>
  </body>
</html>
```

Client side rendering should work now.

## Server side

Now it's time to add Server Side Rendering. Strictly speaking, it's not required but it's a nice-to-have feature.

`index.html` will be generated on-the-fly by page rendering server for each HTTP request, so the old `index.html` may be deleted as it's of no use now.

Start the webpage rendering server:

```javascript
import webpageServer from 'react-isomorphic-render/server'
import settings from './react-isomorphic-render'

// Create webpage rendering server
const server = webpageServer
({
  // HTTP host and port for executing all client-side ajax requests on server-side.
  // This is the host and port on which the web application is run.
  // (because, unlike in the web browser, all URLs on the server-side must be absolute)
  application:
  {
    host: '192.168.0.1',
    port: 80,
    // secure: true // for HTTPS
  },

  // URLs of the "static" javascript and CSS files
  // which will be insterted into the <head/> element of the resulting Html webpage
  // as <script src="..."/> and <link rel="style" href="..."/> respectively.
  // (also can be a function returning an object)
  assets:
  {
    javascript: '/assets/application.js',
    style: '/assets/application.css'
  }
},
settings)

// Start webpage rendering server on port 3000
// (`server.listen(port, [host], [callback])`)
server.listen(3000, function(error)
{
  if (error)
  {
    throw error
  }

  console.log(`Webpage rendering server is listening at http://localhost:${port}`)
})
```

The final step is to set up the main web server (`192.168.0.1:80` in this example) to proxy all HTTP requests for webpages to the webpage rendering server you've just set up.

An example of how HTTP request routing on your main web server can be set up (with page rendering server running on port `3000`):

 * all HTTP GET requests starting with `/assets` return static files from your `assets` folder
 * all HTTP requests starting with `/api` call your REST API methods
 * all the other HTTP GET requests are proxied to `http://localhost:3000` for webpage rendering

Proxying can be easily set up, for example, with [http-proxy](https://github.com/nodejitsu/node-http-proxy) in Node.js

```js
const path = require('path')
const express = require('express')
const httpProxy = require('http-proxy')

// Use Express or Koa, for example
const app = express()
const proxy = httpProxy.createProxyServer({})

// Serve static files
app.use('/assets', express.static(path.join(__dirname, '../assets')))

// Define the REST API
app.get('/api', function(request, response)
{
  response.send({ result: true })
})

// Or just extract the REST API into its own microservice
// app.get('/api', function(request, response)
// {
//   proxy.web(request, response, { target: 'http://localhost:3001' })
// })

// Proxy all unmatched HTTP requests to webpage rendering service
app.use(function(request, response)
{
  proxy.web(request, response, { target: 'http://localhost:3000' })
})
```

For production usage something like the [NginX proxy](https://www.sep.com/sep-blog/2014/08/20/hosting-the-node-api-in-nginx-with-a-reverse-proxy/), obviously, would be a much better fit.

## Without proxying

To use `react-isomorphic-render` without proxying there are two options

  * Either supply custom Koa `middleware` array option in webpage server configuration (recommended)
  * Or call the internal `render` function manually:

```js
import { render } from 'react-isomorphic-render/server'

try
{
  // Returns a Promise.
  //
  // status  - HTTP response status
  // content - rendered HTML document (markup)
  // redirect - redirection URL (in case of HTTP redirect)
  //
  const { status, content, redirect } = await render
  ({
    // Takes the same parameters as webpage server
    application: { host, port },
    assets,

    // Original HTTP request, which is used for
    // getting URL, cloning cookies, and inside `preload`.
    request,

    // Cookies object with `.get(name)` function
    // (only needed if using `authentication` cookie feature)
    cookies,

    // The rest optional parameters are the same
    // as for webpage server and are all optional
  },
  // The second `settings` parameter is the same as for webpage server
  settings)

  if (redirect)
  {
    return request.redirect(redirect)
  }

  response.status(status || 200)
  response.send(content)
}
catch (error)
{
  response.status(500)
  response.send('Internal server error')
}
```

## Page preloading

For page preloading consider using `@preload()` helper to load the neccessary data before the page is rendered.

```javascript
import { title }              from 'react-isomorphic-render'
import { preload }            from 'react-isomorphic-render/redux'
import { connect }            from 'react-redux'
import { bindActionCreators } from 'redux'

// fetches the list of users from the server
function fetchUsers()
{
  return {
    promise: http => http.get('/api/users').then(ids => Promise.map(ids, id => http.get(`/api/users/${id}`))),
    events: ['GET_USERS_PENDING', 'GET_USERS_SUCCESS', 'GET_USERS_FAILURE']
  }
}

@preload(({ dispatch }) => dispatch(fetchUsers))
@connect
(
  state    => ({ users: state.users.users }),
  dispatch => bindActionCreators({ fetchUsers }, dispatch)
)
export default class Page extends Component
{
  static propTypes =
  {
    users      : PropTypes.array.isRequired,
    fetchUsers : PropTypes.func.isRequired
  }

  render()
  {
    return (
      <div>
        {title("Users")}
        <ul>{this.props.users.map(user => <li>{user.name}</li>)}</ul>
        <button onClick={this.props.fetch_users}>Refresh</button>
      </div>
    )
  }

  // Observing action result example (advanced).
  //
  // Suppose you make a `deleteUsers()` function 
  // analagous to the `fetchUsers()` function.
  //
  // Then you can call it like this:
  //
  // <button onClick={::this.deleteUsers}>Delete all users</button>
  //
  // (async/await Babel syntax is used here; can be rewritten as usual Promises)
  //
  async deleteUsers()
  {
    try
    {
      const count = await this.props.deleteUsers()
      alert(`Deleted ${count} users`)
    }
    catch (error)
    {
      alert(error)
    }
  }
}
```

In the example above `@preload()` helper is called to preload a web page before display. It is used to preload pages before rendering them (both on the server side and on the client side). Its arguments are:

```javascript
@preload(function({ dispatch, getState, location, parameters }) { returns Promise })
```

Note: if `@preload()` decorator seems not working then try to place it on top of all other decorators. The possible reason is that it adds a static method to your `Route`'s `component` and some decorator on top of it may not retain that static method (though all proper decorators are agreed to retain static methods and variables).

On the client side, when a user navigates a link, first it changes the URL in the address bar, then it waits for the next page to preload, and, when the next page is fully loaded, then it is displayed to the user. Sometimes preloading a page can take some time to finish so one may want to add a "spinner" to inform the user that the application isn't frozen and the navigation process needs some time to finish. This can be achieved by adding a Redux reducer listening to these three Redux events:

```javascript
import { Preload_started, Preload_finished, Preload_failed } from 'react-isomorphic-render/redux'

export default function(state = {}, event = {})
{
  switch (event.type)
  {
    case Preload_started  : return { ...state, pending: true,  error: false }
    case Preload_finished : return { ...state, pending: false }
    case Preload_failed   : return { ...state, pending: false, error: event.error }
    default               : return state
  }
}
```

And a "spinner" component

```javascript
import React       from 'react'
import { connect } from 'react-redux'

export default connect(state => ({ pending: state.preload.pending }))
(function Spinner(props)
{
  return <div className={"preloading " + (props.pending ? "preloading-show" : "")}/>
})
```

```css
.preloading
{
  position: fixed;

  top    : 0;
  left   : 0;
  right  : 0;
  bottom : 0;

  z-index: 1;

  background-color: rgba(0, 0, 0, 0.2);

  display: none;
}

.preloading-show
{
  display: block;
  cursor: wait;
}
```

## HTTP response status code

To set a custom HTTP response status code for a specific route set the `status` property of that `<Route/>`.

```javascript
export default (
  <Route path="/" component={Layout}>
    <IndexRoute component={Home}/>
    <Route path="blog"  component={Blog}/>
    <Route path="about" component={About}/>
    <Route path="*"     component={PageNotFound} status={404}/>
  </Route>
)
```

## onEnter

While [this Pull Request](https://github.com/acdlite/redux-router/pull/272) in `redux-router` repo has not been accepted yet there's another possibility to get the same functionality

```js
import { onEnter } from 'react-isomorphic-render/redux'

<Route path="user">
  <Route path=":id" component={onEnter(async ({ dispatch, getState }, redirect) => {
    redirect('/somewhere')
  })(UserProfile)}/>
</Route>
```

## Utilities

### Setting webpage title, description, <meta/> tags

Uses [react-helmet](https://github.com/nfl/react-helmet) under the hood.

```javascript
import { head, title, meta } from 'react-isomorphic-render'

const meta =
[
  // <meta charset="utf-8"/>
  { charset: 'utf-8' },

  // <meta name="..." content="..."/>
  { name: 'viewport', content: 'width=device-width, initial-scale=1.0, user-scalable=no' },

  // <meta property="..." content="..."/>
  { property: 'og:title',       content: 'International Bodybuilders Club' },
  { property: 'og:description', content: 'Do some push ups' },
  { property: 'og:locale',      content: 'ru-RU' }
]

// sets specific webpage <head/> tags
{ head('WebApp', meta) }

// webpage title will be replaced with this one
{ title('New webpage title') }

// will add additional <meta/> tags to the webpage <head/>
{ meta({ ... same `meta` as above ... }) }
```

### Locale detection

This library performs the following locale detection steps for each webpage rendering HTTP request:

 * Checks the `locale` query parameter (if it's an HTTP GET request)
 * Checks the `locale` cookie
 * Checks the `Accept-Language` HTTP header
 
The resulting locales array is passed as `preferredLocales` parameter into `localize()` function of the webpage rendering server which then returns `{ locale, messages }`.

### Determining current location

```javascript
@connect(state => ({ location: state.router.location }))
class Component extends React.Component
{
  render()
  {
    return <span>{this.props.location}</span>
  }
}
```

### Changing current location

These two helper Redux actions change the current location (both on client and server).

```javascript
import { goto, redirect } from 'react-isomorphic-render/redux'

// Usage example
// (`goto` navigates to a URL while adding a new entry in browsing history,
//  `redirect` does the same replacing the current entry in browsing history)
return this.props.dispatch(goto('/items/1?color=red'))
```

A sidenote: these two functions aren't supposed to be used inside `onEnter` and `onChange` `react-router` hooks. Instead use the `replace` argument supplied to these functions by `react-router` when they are called (`replace` works the same way as `redirect`).

## `redux-router`

Currently this library uses [`redux-router`](https://github.com/acdlite/redux-router) which seems to be not maintained anymore (e.g. they don't want to merge [my fix for `onEnter` hooks](https://github.com/acdlite/redux-router/pull/272)). I could drop `redux-router` in favour of bare `react-router`, but it would also have a couple of side-effects:

  * Router no more being controlled via Redux actions (`dispatch(goto())`, `dispatch(redirect())`) and instead being manipulated directly via `this.context.router` (`.push()`, `.replace()`). This seems to be a right way to go since there's really no reason for redirecting via dispatching a Redux action. Dispatching a Redux action seems more elegant but at the same time keeping `router` state inside Redux store seems weird and strained.

  * Preloading would require an extra bit of verbosity: instead of just writing `<Route component={Page}/>` it would be written as `<Route component={Page} onEnter={Page.preload}/>` which is gonna get a bit more verbose and copy-pasty for an application having many routes. I currently see no other way to make preloading work with bare `react-router`.

Having said all that, it's definitely possible to drop `redux-router` and rewrite this library with bare `react-router` (say, `react-router@3.x`, since the new `react-router@4.x` is a totally different library), but currently I see no big reason for doing that: it's working fine now, no bugs, etc. The only bug is the `onEnter` hook one, but I implemented a workaround for it too (see `onEnter` section of this readme).

## Caching

[Some thoughts on caching rendered pages](https://github.com/halt-hammerzeit/react-isomorphic-render/blob/master/CACHING.md)

## Monitoring

For each page being rendered stats are reported if `stats()` parameter function is passed as part of the rendering service settings.

```js
{
  ...

  stats({ url, route, time: { preload, render, total } })
  {
    if (total > 1000) // in milliseconds
    {
      db.query('insert into server_side_rendering_stats ...')
    }
  }
}
```

The arguments for the `stats()` function are:

 * `url` — the requested URL (without the `protocol://host:port` part)
 * `route` — `react-router` route string (e.g. `/user/:userId/post/:postId`)
 * `time.preload` — page preload time
 * `time.render` — page React rendering time
 * `time.total` — total time spent preloading and rendering the page

Besides simply logging individual long-taking page renders one could also set up an overall Server Side Rendering performance monitoring using, for example, [StatsD](http://docs.datadoghq.com/guides/dogstatsd/)

```js
{
  ...

  stats({ url, route, time: { preload, render, total } })
  {
    statsd.increment('count')

    statsd.timing('preload', preload)
    statsd.timing('render', render)
    statsd.timing('total', total)

    if (total > 1000) // in milliseconds
    {
      db.query('insert into server_side_rendering_stats ...')
    }
  }
}
```

Where the metrics collected are

 * `count` — rendered pages count
 * `preload` — page preload time
 * `render` — page React rendering time
 * `time` - total time spent preloading and rendering the page

Speaking of StatsD itself, one could either install the conventional StatsD + Graphite bundle or, for example, use something like [Telegraf](https://github.com/influxdata/telegraf) + [InfluxDB](https://www.influxdata.com/) + [Grafana](http://grafana.org/).

Telegraf starter example:

```sh
# Install Telegraf (macOS).
brew install telegraf
# Generate Telegraf config.
telegraf -input-filter statsd -output-filter file config > telegraf.conf
# Run Telegraf.
telegraf -config telegraf.conf
# Request a webpage and see rendering stats being output to the terminal.
```

## CSRF protection

[Cross-Site Request Forgery attacks](http://docs.spring.io/spring-security/site/docs/current/reference/html/csrf.html) are the kind of attacks when a legitimate user is tricked into navigating a malicious website which, upon loading, sends a forged HTTP request (GET, POST) to the legitimate website therefore performing an action on behalf of the legitimate user (because the "remember me" cookie, or the "session id" cookie, is also sent along).

How can a legitimate website guard its users from such attacks? One solution is to ignore the "remember me" ("session id") cookie and force reading its value from an HTTP header. Because CSRF attacks can't send custom headers (at least using bare HTML/Javascript, without exploiting Adobe Flash plugin bugs, etc), this renders such hacking attempts useless. But how is the legitimate webpage supposed to obtain this "remember me" ("session id") token to send it as an HTTP header? The cookie still needs to be used for user's session tracking. It's just that this cookie should only be read by the webpage rendering service (to be injected into the resulting webpage) and never by any of the API services. This way the only thing a CSRF attacker could do is to request a webpage (without being able to analyse its content) which is never an action. And so the user is completely protected against CSRF attacks. The "remember me" ("session id") cookie is also "HttpOnly" to make it only readable on the server-side (to protect the user from session hijacking via XSS attacks).

This library attempts to read authenication token from a cookie named `settings.authentication.cookie` (if this setting is configured). If authentication cookie is present then its value will be sent as part of `Authorization: Bearer {token}` HTTP header when using `http` utility in Redux actions.

## Additional `react-isomorphic-render.js` settings

```javascript
{
  // (optional)
  // User can add his own middleware to this `middleware` list
  redux_middleware: () => [...]

  // (optional)
  // Is called when Redux store has been created
  // (can be used for setting up Webpack Hot Module Replacement)
  on_store_created: ({ reloadReducer }) => {}

  // (optional)
  // `http` utility settings
  http:
  {
    // (optional)
    // Will be called for each HTTP request
    // sent using `http` utility inside Redux action creators.
    // (`request` is a `superagent` request)
    request: (request, { store }) =>
    {
      request.set('X-Something', store.getState().something.value)
    }

    // (optional)
    // Custom control over `http` utility HTTP requests URL.
    // E.g. for those who don't want to proxy API calls (for whatever reasons),
    // and prefer to query REST API server directly from the web browser.
    // The default `url` formatter only allows local paths
    // to be requested therefore guarding against
    // leaking cookies and authentication token headers to a 3rd party.
    // Therefore by supplying a custom `url` formatter
    // a developer takes full responsibility for guarding
    // cookies and authentication token headers from being leaked to a 3rd party.
    url: (path, isServerSide) =>
    {
      return `https://api-server.com${path}`
    }
  }

  // (optional)
  // `@preload()` customization
  preload:
  {
    // (optional)
    // For those coming from `redux-connect`, the same `helpers` parameter.
    // All properties of this object will be available as named arguments
    // inside `@preload({ dispatch, ..., helper })` decorator
    helpers:
    {
      helper: require('./helper')
    },

    // (optional)
    // Handles errors occurring inside `@preload()`.
    // For example, if `@preload()` throws a `new Error("Unauthorized")`,
    // then a redirect to "/unauthorized" page can be made here.
    // If this error handler is defined then it must handle
    // all errors it gets (or just re`throw` them).
    catch: (error, { url, redirect }) => redirect(`/error?url=${encode(url)}&error=${error.status}`)
  }

  // (optional)
  authentication:
  {
    // If this parameter is set,
    // then the page rendering server
    // will try to extract JWT authentication token
    // from this cookie (if present),
    // and then it will always pass the token as part of the
    // "Authorization: Bearer {token}" HTTP header
    // when using `http` utility inside Redux actions.
    cookie: 'jwt-cookie-name'

    // (optional)
    // The HTTP header containing authentication token
    // (e.g. "Authorization: Bearer {token}").
    // Is "Authorization" by default.
    header: 'Authorization'
  }

  // (optional)
  // `react-router`s `onUpdate` handler
  // (is fired when a user performs navigation)
  on_navigate: (location) => {}

  // (optional)
  // `history` options (like `basename`)
  history: {}

  // (optional)
  // Controls automatic `Date` parsing
  // when using `http` utility, and when
  // restoring Redux state on the client-side.
  // (is `true` by default)
  parse_dates: `true` / `false`
}
```

## Miscellaneous webpage rendering server options

```javascript
{
  ...

  // URLs of javascript and CSS files
  // which will be insterted into the <head/> element of the resulting Html webpage
  // (as <script src="..."/> and <link rel="style" href="..."/>)
  //
  // Also a website "favicon" URL, if any.
  //
  // Can be an `object` or a `function(url, { store })`.
  //
  // `javascript` and `style` can be strings or objects.
  // If they are objects then also provide an `entry` parameter.
  // The objects may also contain `common` entry
  // which will also be included on the page.
  //
  assets: (url, { store }) =>
  {
    return {
      javascript: '/assets/main.js',

      // (optional)
      style: '/assets/main.css',

      // (optional)
      // URL of your "favicon".
      // If you're using Webpack then the URL is the result of a require() call.
      icon: '/assets/icon.png',

      // (only required when `javascript` and `style` are objects)
      entry: 'webpack entry key' // e.g. 'main'
    }
  },

  // (optional)
  // Is called when an error happens on the server side
  // (can redirect to special "500 Error" pages).
  // If this error handler is defined then it must handle
  // all errors it gets (or just re`throw` them).
  //
  // This error handler can (and most likely should)
  // be the same one used as `preload.catch` option.
  //
  catch: (error, { url, redirect }) => redirect(`/error?url=${encode(url)}&error=${error.status}`)

  // (optional)
  // Custom Koa middleware (an array of middlewares).
  // Inserted before page rendering middleware.
  // (if anyone needs that for extending
  //  page rendering service with extra functionality)
  middleware: [...]

  // (optional)
  // HTML code injection
  html:
  {
    // (optional)
    // Returns React element an array of React elements
    // which will be inserted into server rendered webpage's <head/>
    // (in case of an array use `key`s to prevent React warning)
    head: (url) => React element or an array of React elements

    // (optional)
    // Allows for wrapping React page component with arbitrary elements
    // (or doing whatever else can be done with a React element).
    // Returns either a React element or an array of React elements
    // which will be inserted into server rendered webpage's <body/>
    body: reactPageElement => reactPageElement

    // (optional)
    // Returns React element or an array of React elements.
    // Allows adding arbitrary React elements to the start of the <body/>
    // (use `key`s to prevent React warning when returning an array of React elements)
    body_start: (url) => React element or an array of React elements

    // (optional)
    // Returns React element or an array of React elements.
    // Allows adding arbitrary React elements to the end of the <body/>
    // (use `key`s to prevent React warning when returning an array of React elements)
    body_end: (url) => React element or an array of React elements
  }

  // (optional)
  // Preloads data before performing page rendering.
  //
  // If this function returns an object then this object
  // will be the initial Redux state.
  // 
  // `request` is the original HTTP request for the webpage.
  // It can be used, for example, to load the currently
  // logged in user info (user name, user picture, etc).
  //
  preload: async (httpClient, { request }) => ({})
  // (or same without `async`: (httpClient, { request }) => Promise.resolve({})

  // (optional)
  //
  // Returns an object of shape `{ locale, messages }`,
  // where `locale` is the page locale chosen for this HTTP request,
  // and `messages` are the translated messages for this `locale`
  // (an object of shape `{ "message.key": "Message value", ... }`).
  //
  // The returned object may optionally have
  // the third property `messagesJSON`
  // to avoid calculating `JSON.stringify(messages)`
  // for each rendered page (a tiny optimization).
  //
  // `preferredLocales` argument is an array
  // of the preferred locales for this user
  // (from the most preferred to the least preferred)
  //
  localize: (store, preferredLocales) => ({ locale: preferredLocales[0], messages: { 'page.heading': 'Test' } })

  // Is Server Side Rendering enabled?
  // (is `true` by default)
  // Can be used to temporarily disable server-side rendering
  // (e.g. as a performance optimization)
  render: `true`/`false`

  // (optional)
  // A React element for "loading" page (when server-side rendering is disabled)
  loading: <div className="loading">Loading...</div>

  // (optional)
  // A custom `log`
  log: bunyan.createLogger(...)
}
```

## Miscellaneous client-side rendering options

```javascript
{
  ...

  // (optional)
  // Enables/disables Redux development tools.
  //
  // This is not an optional `true` boolean flag,
  // but rather an optional "DevTools" instance created by "createDevTools()".
  //
  // An example of "DevTools.js":
  //
  // npm install redux-devtools redux-devtools-log-monitor redux-devtools-dock-monitor --save-dev
  //
  // import React from 'react'
  // import { createDevTools, persistState } from 'redux-devtools'
  // import LogMonitor from 'redux-devtools-log-monitor'
  // import DockMonitor from 'redux-devtools-dock-monitor'
  // 
  // export default
  // {
  //   component: createDevTools
  //   (
  //     <DockMonitor toggleVisibilityKey="ctrl-H" changePositionKey="ctrl-Q" defaultIsVisible>
  //       <LogMonitor theme="tomorrow" />
  //     </DockMonitor>
  //   ),
  //   persistState
  // }
  //
  devtools: __development__ ? require('./DevTools.js') : undefined  // (optional)

  // (optional)
  // Loads localized messages (asynchronously).
  // The main purpose for introducting this function
  // is to enable Webpack Hot Module Replacement (aka "hot reload)
  // for translation files in development mode.
  translation: async locale => messages
  // (or same without `async`: locale => Promise.resolve(messages))
}
```

Client-side `render` function returns a `Promise` resolving to an object

```js
{
  component, // root React component (i.e. the `wrapper`; will be `null` if `wrapper` is a stateless React component)
  store,     // (Redux) store
  rerender   // (Redux) rerender React application
}
```

## Gotchas

This library is build system agnostic: you can use your favourite Grunt, Gulp, Browserify, RequireJS, Webpack, etc.

If you're using Webpack then make sure you either build your server-side code with Webpack too (so that asset `require()` calls (images, styles, fonts, etc) inside React components work, see [universal-webpack](https://github.com/halt-hammerzeit/universal-webpack)) or use [webpack-isomorphic-tools](https://github.com/halt-hammerzeit/webpack-isomorphic-tools).

## Contributing

After cloning this repo, ensure dependencies are installed by running:

```sh
npm install
```

This module is written in ES6 and uses [Babel](http://babeljs.io/) for ES5
transpilation. Widely consumable JavaScript can be produced by running:

```sh
npm run build
```

Once `npm run build` has run, you may `import` or `require()` directly from
node.

After developing, the full test suite can be evaluated by running:

```sh
npm test
```

When you're ready to test your new functionality on a real project, you can run

```sh
npm pack
```

It will `build`, `test` and then create a `.tgz` archive which you can then install in your project folder

```sh
npm install [module name with version].tar.gz
```

## License

[MIT](LICENSE)