# react-isomorphic-render

[![npm version](https://img.shields.io/npm/v/react-isomorphic-render.svg?style=flat-square)](https://www.npmjs.com/package/react-isomorphic-render)
[![npm downloads](https://img.shields.io/npm/dm/react-isomorphic-render.svg?style=flat-square)](https://www.npmjs.com/package/react-isomorphic-render)

Server Side Rendering for `React + React-router + Redux` stack.

 * Asynchronously preloads pages before performing client-side navigation
 * Provides an isomorphic HTTP client for calling REST API in Redux ["action creators"](http://redux.js.org/docs/basics/Actions.html)
 * Supports Webpack "hot reload" (aka "Hot Module Replacement")
 * Provides supplementary utilities: locale detection for internationalization, easy setting page `<title/>` and `<meta/>`, programmatic redirects, 100% correct handling of HTTP Cookies, etc

## Why Server Side Rendering

### World-Wide Web Concepts

The original concept of the web was one of a network of "resources" interconnected with "hyperlinks": a user could query a "resource" by a "Universal Resource Link" (URL) and then travel to any of the connected "resources" just by navigating the corresponding hyperlinks, and then it would all repeat recursively therefore interconnecting each and every "resource" into a giant interconnected web (hence the name). The "resources" were meant to be "documents", like reports, articles, papers, news, books, etc.

The web wasn't meant at all for "applications". At first javascript was only used to bring some naive interactivity to static "documents", like following the cursor with a sprinkle, or adding christmas snow to a page, or applying some effect to a picture upon mouseover. Initially javascript was never meant to be a means of operating on the page's "content". It was just for "presentation" ("view"), not the "content".

Ajax wasn't originally meant for "content" too: it was just for tiny utility things like hitting a "Like" button without needlessly refreshing the whole freaking page, but it was then too turned into a machinery for fetching a page's "content".

And so [the Web became broken](https://ponyfoo.com/articles/stop-breaking-the-web). And to completely fix that and make the Web 100% pure again total Server Side Rendering for each dynamic website is the only way to go. This is still a purely esthetical argument and nobody would really care (except purists and perfectionists) if it didn't come to being able to be indexed by Google...

### Search engines

Search engine crawlers like Google bot won't wait for a page to make its Ajax calls to an API server for data: they would simply abort all **asynchronous** javascript and index the page as is. Don't mistake it for web crawlers not being able to execute javascript — they're [perfectly fine](http://andrewhfarmer.com/react-seo/) with doing that ([watch out though](https://blog.codaxy.com/debugging-googlebot-crawl-errors-for-javascript-applications-5d9134c06ee7) for using the latest and greatest and always use polyfills for the older browsers since web crawlers may be using those under the hood).

So the only thing preventing a dynamic website from being indexed by a crawler is Ajax, not javascript. This therefore brings two solutions: one is to perform everything (routing, data fetching, rendering) on the server side and the other is to perform routing and data fetching on the server side leaving rendering to the client's web browser. Both these approaches work with web crawlers. And this is what this library provides.

While the first approach is more elegant and pure, currently it is a very CPU intensive task to render a moderately complex React page using `ReactDOM.renderToString()` (takes about 100 milliseconds of blocking CPU single core time for complex pages having more than 1000 components, as of 2016). Facebook doesn't use Server Side Rendering itself so optimizing this part of the React library is not a priority for them. So until this (if ever possible) Server Side Rendering performance issue is fixed I prefer the second approach: performing routing and page preloading on the server side while leaving page rendering to the client. This is achieved by using `render: false` flag (described much further in this document).

### Page loading time

The final argument in favour of Server Side Rendering is that even if a website doesn't need search engine indexing it would still benefit from employing Server Side Rendering because that would save that additional HTTP roundtrip from the web browser to the API server for fetching the page's data. And no matter how fast the API server is, [latency is unbeatable](https://www.igvita.com/2012/07/19/latency-the-new-web-performance-bottleneck/) being about 100ms. So, by performing routing and page preloading on the server side one can speed up website loading by about 100ms. Not that it mattered that much for non-perfectionists but still why not do it when it's so simple to implement.

## Installation

```bash
$ npm install react-isomorphic-render --save
```

## Usage

(see [webapp](https://github.com/halt-hammerzeit/webapp) and [webpack-react-redux-isomorphic-render-example](https://github.com/halt-hammerzeit/webpack-react-redux-isomorphic-render-example) as references)

Start by creating your `react-isomorphic-render.js` set up file (it configures both client side and server side)

```javascript
export default {
  // Redux reducer
  // (either a reducer or a function returning a reducer)
  reducer: require('./src/client/redux/reducer'),

  // React-router routes
  // (either a `<Route/>` element or a
  //  `function({ dispatch, getState })`
  //  returning a `<Route/>` element)
  routes: require('./src/client/routes'),
  
  // A React component.
  // Wraps React page component with arbitrary elements
  // (e.g. Redux <Provider/>, and other "context providers")
  wrapper: require('./src/client/wrapper')
}
```

An example of a `wrapper` component:

```javascript
import React from 'react'
import { Provider } from 'react-redux'

export default class Wrapper extends React.Component {
  render() {
    const { store, children } = this.props
    return <Provider store={ store }>{ children }</Provider>
  }
}
```

Then create your client-side main application file (`application.js`)

```javascript
// Include CSS styles in the bundle
require('../styles/main.css')

import { render } from 'react-isomorphic-render'
import settings from './react-isomorphic-render'

// Render the page in web browser
render(settings)
```

And the `index.html` would look like this:

```html
<html>
  <head>
    <title>react-isomorphic-render</title>
    <link rel="stylesheet" type="text/css" href="/assets/main.css">
  </head>
  <body>
    <div id="react"></div>
    <script src="/assets/main.js"></script>
  </body>
</html>
```

Notice the `/assets/main.css` and `/assets/main.js` paths: I suppose you're running [`webpack-dev-server`](https://webpack.github.io/docs/webpack-dev-server.html) and this `index.html` file is put into the `build` folder.

Now open `localhost:8080` in a web browser. Client side rendering should work now.

## Server side

Now it's time to add Server Side Rendering, and also serving "static files" via HTTP for production mode, when `webpack-dev-server` is not running.

`index.html` will be generated on-the-fly by page rendering server for each HTTP request, so the old `index.html` may be deleted as it's of no use now.

Start the webpage rendering server (also serving assets):

```javascript
import path from 'path'
import webpageServer from 'react-isomorphic-render/server'
import statics from 'koa-static'
import mount from 'koa-mount'

import settings from './react-isomorphic-render'

// Cache assets in the web browser for 1 year by default
const maxAge = 365 * 24 * 60 * 60;

// Create webpage rendering server
const server = webpageServer(settings, {
  // HTTP host and port for performing all AJAX requests
  // when rendering pages on server-side.
  // E.g. an AJAX request to `/items/5` will be transformed to
  // `http://${host}:${port}/items/5` during server-side rendering.
  // Specify `secure: true` flag to use `https` protocol instead of `http`.
  application: {
    host: '192.168.0.1',
    port: 80,
    // secure: true
  },

  // URLs of the "static" javascript and CSS files
  // which will be insterted into the <head/> element of the resulting Html webpage
  // as <script src="..."/> and <link rel="style" href="..."/> respectively.
  // (also can be a function returning an object)
  // (this is for the main application JS and CSS only,
  //  for 3rd party JS and CSS use `html` parameter instead)
  assets: {
    javascript: '/assets/main.js',
    style: '/assets/main.css'
  },

  // (optional)
  // Custom Koa middlewares.
  // Inserted before page rendering middleware.
  // Adjust the path to the Webpack `build` folder.
  middleware: [mount('/assets', statics(path.join(__dirname, '../build'), { maxAge }))]
})

// Start webpage rendering server on port 3000
// (`server.listen(port, [host], [callback])`)
server.listen(3000, function(error) {
  if (error) {
    throw error
  }
  console.log(`Webpage rendering server is listening at http://localhost:${port}`)
})
```

`server` is just a [Koa](http://koajs.com/) application, so alternatively it could be started like this:

```js
import http from 'http'
import webpageServer from 'react-isomorphic-render/server'
const server = webpageServer(settings, {...})
http.createServer(server.callback()).listen(3000, error => ...)
```

And for HTTPS websites start the page server like this:

```js
import https from 'https'
import webpageServer from 'react-isomorphic-render/server'
const server = webpageServer(settings, {...})
https.createServer(options, server.callback()).listen(3001, error => ...)
```

Now [disable javascript in Chrome DevTools](http://stackoverflow.com/questions/13405383/how-to-disable-javascript-in-chrome-developer-tools), go to `localhost:3000` and the server should respond with a rendered page.

## Proxying

In the example above all HTTP requests to the server are served with HTML pages which is not the case in real-world applications: for example, a request to `/items` REST API should return a JSON response from the database.

To accomplish that a proxy server is set up which routes all HTTP requests to their appropriate destination. For example, API requests go to the REST API server, requests for static files return static files, and HTTP requests for webpages are routed to the webpage rendering server. So the HTTP proxying plan would look like this:

 * all HTTP GET requests starting with `/assets` return static files from your `assets` folder
 * all HTTP requests starting with `/api` are proxied to the REST API service
 * all the other HTTP GET requests are proxied to `http://localhost:3000` for webpage rendering

For development purposes, proxying can be easily set up, for example, using [http-proxy](https://github.com/nodejitsu/node-http-proxy) library in Node.js

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
app.get('/api', function(request, response) {
  response.send({ result: true })
})

// Or just extract the REST API into its own microservice
// app.get('/api', function(request, response) {
//   proxy.web(request, response, { target: 'http://localhost:3001' })
// })

// Proxy all unmatched HTTP requests to webpage rendering service
app.use(function(request, response) {
  proxy.web(request, response, { target: 'http://localhost:3000' })
})
```

For production usage something like the [NginX proxy](https://www.sep.com/sep-blog/2014/08/20/hosting-the-node-api-in-nginx-with-a-reverse-proxy/) is a better solution (both for proxying and for serving static files).

## Without proxying

(Advanced section, may be skipped)

To use `react-isomorphic-render` without proxying there are two options

  * Either supply custom Koa `middleware` array option in webpage server configuration
  * Or call the internal `render` function manually:

```js
import { render } from 'react-isomorphic-render/server'
import settings from './react-isomorphic-render'

try {
  // Returns a Promise.
  //
  // status  - HTTP response status
  // content - rendered HTML document (markup)
  // redirect - redirection URL (in case of HTTP redirect)
  //
  const { status, content, redirect } = await render(settings, {
    // Takes the same parameters as webpage server
    application: { host, port },
    assets,

    // Original HTTP request, which is used for
    // getting URL, cloning cookies, and inside `initialize`.
    request,

    // Cookies object with `.get(name)` function
    // (only needed if using `authentication` cookie feature)
    cookies,

    // The rest optional parameters are the same
    // as for webpage server and are all optional
  })

  if (redirect) {
    return redirect_to(redirect)
  }

  response.status(status || 200)
  response.send(content)
} catch (error) {
  response.status(500)
  response.send('Internal server error')
}
```

## Ajax

If a Redux action creator returns an object with `promise` (function) and `events` (array) keys then this action is assumed asynchronous.

 * An event of `type` `events[0]` is dispatched
 * `promise` function gets called and returns a `Promise`
 * If the `Promise` succeeds then an event of `type` `events[1]` is dispatched having `result` property set to the `Promise` result
 * If the `Promise` fails then an event of `type` `events[2]` is dispatched having `error` property set to the `Promise` error

Example:

```js
function asynchronousAction() {
  return {
    promise: () => Promise.resolve({ success: true }),
    events: ['PROMISE_PENDING', 'PROMISE_SUCCESS', 'PROMISE_ERROR']
  }
}
```

When you find yourself copy-pasting those `_PENDING`, `_SUCCESS` and `_ERROR` event names from one action creator to another then take a look at `asynchronousActionEventNaming` setting described in the [Additional `react-isomorphic-render.js` settings](https://github.com/halt-hammerzeit/react-isomorphic-render#additional-react-isomorphic-renderjs-settings) section of this document.

### HTTP utility

For convenience, the argument of the `promise` function is the built-in `http` utility having methods `get`, `head`, `post`, `put`, `patch`, `delete`, each returning a `Promise` and taking three arguments: the `url` of the HTTP request, `parameters` object, and an `options` object. It can be used to easily query HTTP REST API endpoints in Redux action creators.

```js
function fetchAdmins() {
  return {
    promise: http => http.get('/api/users', { role: 'admin' }),
    events: ['GET_USERS_PENDING', 'GET_USERS_SUCCESS', 'GET_USERS_FAILURE']
  }
}
```

Using ES6 `async/await` this `promise` function can be rewritten as

```js
function fetchAdmins() {
  return {
    promise: async http => await http.get('/api/users', { role: 'admin' }),
    events: ['GET_USERS_PENDING', 'GET_USERS_SUCCESS', 'GET_USERS_FAILURE']
  }
}
```

### File upload

The `http` utility will also upload files if they're passed as part of `parameters` (example below). Any of these types of file `parameters` are accepted:

* In case of a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) parameter it will be a single file upload.
* In case of a [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList) parameter with a single `File` inside it would be treated as a single `File`.
* In case of a `FileList` parameter with multiple `File`s inside multiple file upload will be performed.
* In case of an `<input type="file"/>` DOM element parameter its `.files` will be taken as a `FileList` parameter.

Progress can be metered by passing `progress` option as part of the `options` argument.

```js
// React component
class ItemPage extends React.Component {
  render() {
    return (
      <div>
        ...
        <input type="file" onChange={this.onFileSelected}/>
      </div>
    )
  }

  // Make sure to `.bind()` this handler
  onFileSelected(event) {
    const file = event.target.files[0]

    // Could also pass just `event.target.files` as `file`
    dispatch(uploadItemPhoto(itemId, file))

    // Reset the selected file
    // so that onChange would trigger again
    // even with the same file.
    event.target.value = null
  }
}

// Redux action creator
function uploadItemPhoto(itemId, file) {
  return {
    promise: http => http.post(
      '/item/photo',
      { itemId, file },
      { progress(percent) { console.log(percent) } }
    ),
    events: ['UPLOAD_ITEM_PHOTO_PENDING', 'UPLOAD_ITEM_PHOTO_SUCCESS', 'UPLOAD_ITEM_PHOTO_FAILURE']
  }
}
```

### JSON Date parsing

By default, when using `http` utility all JSON responses get parsed for javascript `Date`s which are then automatically converted from `String`s to `Date`s. This is convenient, and also safe because such date `String`s have to be in a very specific ISO format in order to get parsed (`year-month-dayThours:minutes:secondstimezone`), but if someone still prefers to disable this feature then there's the `parseDates: false` flag in the configuration to turn that off.

## Page preloading

For page preloading consider using `@preload()` helper to load the neccessary data before the page is rendered.

```javascript
import { connect } from 'react-redux'
import { title, preload } from 'react-isomorphic-render'

// fetches the list of users from the server
function fetchUsers() {
  return {
    promise: http => http.get('/api/users').then(ids => Promise.map(ids, id => http.get(`/api/users/${id}`))),
    events: ['GET_USERS_PENDING', 'GET_USERS_SUCCESS', 'GET_USERS_FAILURE']
  }
}

@preload(({ dispatch }) => dispatch(fetchUsers))
@connect(
  state => ({ users: state.users.users }),
  { fetchUsers })
)
export default class Page extends Component {
  render() {
    const { users, fetchUsers } = this.props
    return (
      <div>
        { title("Users") }
        <ul>{ users.map(user => <li>{ user.name }</li>) }</ul>
        <button onClick={ fetchUsers }>Refresh</button>
      </div>
    )
  }
}
```

In the example above `@preload()` helper is called to preload a web page before display. It is used to preload pages before rendering them (both on the server side and on the client side). `@preload()` decorator takes a function which must return a `Promise`:

```javascript
@preload(function({ dispatch, getState, location, parameters }) { return Promise })
```

When `dispatch` is called with a special "asynchronous" action (having `promise` and `events` properties) then such a `dispatch()` call will return a `Promise`, that's why in the example above it's written as:

```js
@preload(({ dispatch }) => dispatch(fetchUsers))
```

Note: `transform-decorators-legacy` Babel plugin is needed at the moment to make decorators work in Babel

```sh
npm install babel-plugin-transform-decorators-legacy --save
```

#### .babelrc

```js
{
  "presets": [
    ...
  ],
  "plugins": [
    "transform-decorators-legacy"
  ]
}
```

P.S.: if `@preload()` decorator seems not working (though it definitely should) then try to place it on top of all other decorators. The possible reason is that it adds a static method to your `Route`'s `component` and some decorator on top of it may not retain that static method (though all proper decorators are agreed to retain static methods and variables).

On the client side, in order for `@preload` to work all `<Link/>`s imported from `react-router` **must** be instead imported from `react-isomorphic-render`. Upon a click on a `<Link/>` first it waits for the next page to preload, and, when the next page is fully loaded, then it is displayed to the user and the URL in the address bar is updated. Sometimes preloading a page can take some time to finish so one may want to add a "spinner" to inform the user that the application isn't frozen and the navigation process needs some time to finish. This can be achieved by adding a Redux reducer listening to these three Redux events:

```javascript
import { PRELOAD_STARTED, PRELOAD_FINISHED, PRELOAD_FAILED } from 'react-isomorphic-render'

export default function(state = {}, action = {}) {
  switch (action.type) {
    case PRELOAD_STARTED  : return { ...state, pending: true,  error: false }
    case PRELOAD_FINISHED : return { ...state, pending: false }
    case PRELOAD_FAILED   : return { ...state, pending: false, error: event.error }
    default               : return state
  }
}
```

And a "spinner" component

```javascript
import React       from 'react'
import { connect } from 'react-redux'

@connect(state => ({ pending: state.preload.pending }))
export default function Spinner(props) {
  return <div className={ `preloading ${props.pending ? 'preloading--shown' : ''}` }/>
}
```

```css
.preloading {
  position: fixed;
  top    : 0;
  left   : 0;
  right  : 0;
  bottom : 0;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.2);
  display: none;
}

.preloading--shown {
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

## Utilities

### Setting webpage title, description, <meta/> tags

Uses [react-helmet](https://github.com/nfl/react-helmet) under the hood.

```javascript
import { head, title, meta } from 'react-isomorphic-render'

const meta = [
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

### Handling asynchronous actions

Once one starts writing a lot of Ajax calls in Redux it becomes obvious that there's **a lot** of boilerplate copy-pasting involved. To reduce those tremendous amounts of copy-pasta an "asynchronous action handler" may be used:

#### redux/blogPost.js

```js
import { action, createHandler, stateConnector } from 'react-isomorphic-render'
// (`./react-isomorphic-render-async.js` settings file is described below)
import settings from './react-isomorphic-render-async'

const handler = createHandler(settings)

// Post comment Redux "action creator"
export const postComment = action({
  namespace: 'BLOG_POST',
  event: 'POST_COMMENT',
  promise(userId, blogPostId, commentText, http) {
    return http.post(`/blog/posts/${blogPostId}/comment`, {
      userId: userId,
      text: commentText
    })
  }
},
handler)

// Get comments Redux "action creator"
export const getComments = action({
  namespace: 'BLOG_POST',
  event: 'GET_COMMENTS',
  promise(blogPostId, http) {
    return http.get(`/blog/posts/${blogPostId}/comments`)
  },
  // The fetched comments will be placed
  // into the `comments` Redux state property.
  result: 'comments'
  // Or write it as a reducer:
  // result: (state, result) => ({ ...state, comments: result })
},
handler)

// This is for the Redux `@connect()` helper below
handler.addStateProperties('comments')

// A developer can additionally handle any other custom events
handler.handle(eventName('BLOG_POST', 'CUSTOM_EVENT'), (state, action) => ({
  ...state,
  customProperty: action.result
}))

// This is for the Redux `@connect()` helper below
handler.addStateProperties('customProperty')

// A little helper for Redux `@connect()`
export const connector = stateConnector(handler)

// This is the Redux reducer which now
// handles the asynchronous actions defined above.
export default handler.reducer()
```

#### redux/reducer.js

```js
export { default as blogPost } from './blogPost'
...
```

And a React component would look like this

```js
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { preload } from 'react-isomorphic-render'
import { connector, getComments, postComment } from './redux/blogPost'

// Preload comments before showing the page
// (see "Page preloading" section of this document)
@preload(({ dispatch, getState, parameters }) => {
  return dispatch(getComments(parameters.blogPostId))
})
// See `react-redux` documentation on `@connect()` decorator
@connect((state) => ({
  userId: state.user.id,
  // `connector` will populate the Redux `props`
  ...connector(state.blogPost)
}), {
  postComment
})
export default class BlogPostPage extends Component {
  render() {
    const {
      getCommentsPending,
      getCommentsError,
      comments
    } = this.props

    if (getCommentsError) {
      return <div>Couldn't load comments</div>
    }

    return (
      <div>
        <ul>
          { comments.map(comment => <li>{comment}</li>) }
        </ul>
        {this.renderPostCommentForm()}
      </div>
    )
  }

  renderPostCommentForm() {
    const {
      userId,
      params,
      postComment,
      postCommentPending,
      postCommentError
    } = this.props

    if (postCommentPending) {
      return <div>Posting comment...</div>
    }

    if (postCommentError) {
      return <div>Couldn't post comment</div>
    }

    return (
      <button onClick={() => postComment(userId, params.blogPostId, 'text')}>
        Post comment
      </button>
    )
  }
}
```

And the additional configuration would be:

#### react-isomorphic-render.js

```js
import asyncSettings from './react-isomorphic-render-async'

export default {
  // All the settings as before

  ...asyncSettings
}
```

#### react-isomorphic-render-async.js

```js
import { underscoredToCamelCase } from 'react-isomorphic-render'

export default {
  // When supplying `event` instead of `events`
  // as part of an asynchronous Redux action
  // this will generate `events` from `event`
  // using this function.
  asynchronousActionEventNaming: event => ([
    `${event}_PENDING`,
    `${event}_SUCCESS`,
    `${event}_ERROR`
  ]),

  // When using "asynchronous action handlers" feature
  // this function will generate a Redux state property name from an event name.
  // E.g. event `GET_USERS_ERROR` => state.`getUsersError`.
  asynchronousActionHandlerStatePropertyNaming: underscoredToCamelCase,
}
```

Notice the extraction of these two configuration parameters into a separate file `react-isomorphic-render-async.js`: it is done to break circular dependency on `./react-isomorphic-render.js` file because `routes` `import` React page components which in turn `import` action creators which in turn import `./react-isomorphic-render.js` hence the circular (recursive) dependency (same goes for `reducer`).

### Locale detection

This library performs the following locale detection steps for each webpage rendering HTTP request:

 * Checks the `locale` query parameter (if it's an HTTP GET request)
 * Checks the `locale` cookie
 * Checks the `Accept-Language` HTTP header
 
The resulting locales array is passed as `preferredLocales` parameter into `localize()` function of the webpage rendering server which then returns `{ locale, messages }`.

<!-- ### Determining current location

```javascript
@connect(state => ({ location: state.router.location }))
class Component extends React.Component {
  render() {
    return <span>{this.props.location}</span>
  }
}
``` -->

### Changing current location

These two helper Redux actions change the current location (both on client and server).

```javascript
import { goto, redirect } from 'react-isomorphic-render'
import { connect } from 'react-redux'

// Usage example
// (`goto` navigates to a URL while adding a new entry in browsing history,
//  `redirect` does the same replacing the current entry in browsing history)
@connect(state = {}, { goto, redirect })
class Page extends Component {
  handleClick(event) {
    const { goto, redirect } = this.props
    goto('/items/1?color=red')
    // redirect('/somewhere')
  }
}
```

A sidenote: these two functions aren't supposed to be used inside `onEnter` and `onChange` `react-router` hooks. Instead use the `replace` argument supplied to these functions by `react-router` when they are called (`replace` works the same way as `redirect`).

## Caching

[Some thoughts on caching rendered pages](https://github.com/halt-hammerzeit/react-isomorphic-render/blob/master/CACHING.md)

## Monitoring

For each page being rendered stats are reported if `stats()` parameter function is passed as part of the rendering service settings.

```js
{
  ...

  stats({ url, route, time: { initialize, preload, render, total } }) {
    if (total > 1000) { // in milliseconds
      db.query('insert into server_side_rendering_stats ...')
    }
  }
}
```

The arguments for the `stats()` function are:

 * `url` — the requested URL (without the `protocol://host:port` part)
 * `route` — `react-router` route string (e.g. `/user/:userId/post/:postId`)
 * `time.initialize` — server side `initialize()` function execution time (if defined)
 * `time.preload` — page preload time
 * `time.render` — page React rendering time
 * `time.total` — total time spent preloading and rendering the page

Rendering a complex React page (having more than 1000 components) takes about 100ms (`time.render`). This is quite slow but that's how React Server Side Rendering currently is.

Besides simply logging individual long-taking page renders one could also set up an overall Server Side Rendering performance monitoring using, for example, [StatsD](http://docs.datadoghq.com/guides/dogstatsd/)

```js
{
  ...

  stats({ url, route, time: { initialize, preload, render, total } }) {
    statsd.increment('count')

    statsd.timing('initialize', initialize)
    statsd.timing('preload', preload)
    statsd.timing('render', render)
    statsd.timing('total', total)

    if (total > 1000) { // in milliseconds
      db.query('insert into server_side_rendering_stats ...')
    }
  }
}
```

Where the metrics collected are

 * `count` — rendered pages count
 * `initialize` — server side `initialize()` function execution time (if defined)
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

## Webpack HMR

Webpack's [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) (aka Hot Reload) works for React components and Redux reducers and Redux action creators.

HMR setup for Redux reducers is as simple as adding `store.hotReload()` (as shown below). For enabling [HMR on React Components](https://webpack.js.org/guides/hmr-react/) (and Redux action creators) I would suggest the new [react-hot-loader 3](https://github.com/gaearon/react-hot-loader) (which is still in beta, so install it like `npm install react-hot-loader@3.0.0-beta.6 --save`):

#### application.js

```js
import settings from './react-isomorphic-render'

render(settings).then(({ store, rerender }) => {
  if (module.hot) {
    // This path must be equal to the path
    // inside the `require()` call in the `routes` parameter
    module.hot.accept('./react-isomorphic-render', () => {
      rerender()
      // Update reducer (for Webpack 2 ES6)
      store.hotReload(settings.reducer)
      // Update reducer (for Webpack 1)
      // store.hotReload(require('./react-isomorphic-render').reducer)
    })
  }
})
```

#### wrapper.js

```js
import React, { Component, PropTypes } from 'react'
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader'

export default class Wrapper extends Component {
  static propTypes = {
    store: React.PropTypes.object.isRequired
  }

  render() {
    const { store, children } = this.props;

    return (
      <AppContainer>
        <Provider store={ store }>
          { children }
        </Provider>
      </AppContainer>
    )
  }
}
```

#### .babelrc

```js
{
  "presets": [
    "react",
    // For Webpack 2 ES6:
    ["es2015", { modules: false }],
    // For Webpack 1:
    // "es2015",
    "stage-2"
  ],

  "plugins": [
    "react-hot-loader/babel"
  ]
}
```

#### webpack.config.js

```js
export default {
  entry: {
    main: [
      'react-hot-loader/patch',
      'webpack-hot-middleware/client?http://localhost:8080',
      'webpack/hot/only-dev-server',
      './src/application.js'
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    ...
  ],
  ...
}
```

## Other `react-isomorphic-render.js` settings

```javascript
{
  // (optional)
  // User can add his own middleware to this `middleware` list
  reduxMiddleware: () => [...]

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
      // In this case `.application` configuration parameter may be removed
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
    catch: (error, { url, redirect, dispatch, getState }) => redirect(`/error?url=${encode(url)}&error=${error.status}`)
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
  // `history` options (like `basename`)
  history: {}

  // (optional)
  // Controls automatic `Date` parsing
  // when using `http` utility, and when
  // restoring Redux state on the client-side.
  // (is `true` by default)
  parseDates: `true` / `false`

  // (optional)
  // When supplying `event` instead of `events`
  // as part of an asynchronous Redux action
  // this will generate `events` from `event`
  // using this function.
  asynchronousActionEventNaming: event => ([
    `${event}_PENDING`,
    `${event}_SUCCESS`,
    `${event}_ERROR`
  ])

  // (optional)
  // When using asynchronous action handlers
  // this function will generate a Redux state property name for an event name.
  // E.g. event `GET_USERS_ERROR` => state.`getUsersError`.
  asynchronousActionHandlerStatePropertyNaming(event) {
    // Converts `CAPS_LOCK_UNDERSCORED_NAMES` to `camelCasedNames`
    return event.split('_')
      .map((word, i) =>  {
        let firstLetter = word.slice(0, 1)
        if (i === 0) {
          firstLetter = firstLetter.toLowerCase()
        }
        return firstLetter + word.slice(1).toLowerCase()
      })
      .join('')
  }
}
```

## Other webpage rendering server options

```javascript
{
  ...

  // `assets` parameter is introduced for the cases
  // when the project is built with Webpack.
  //
  // The reason is that usually the output filenames
  // in Webpack contain `[hash]`es or `[chunkhash]`es,
  // and so when the project is built
  // the assets have not their original filenames (like "main.js")
  // but rather autogenerated filenames (like "main-0ad5f7ec51a....js"),
  // so the corresponding `<script/>` tags must not be constant
  // and must instead be autogenerated each time the project is built.
  // That's what this `assets` parameter does:
  // if one passes these `assets` to the webpage rendering server,
  // then they will be transformed into the corresponding HTML tags
  // each time the `assets` are changed (i.e. each time the project is rebuilt).
  //
  // The `assets` parameter provides URLs of javascript and CSS files
  // which will be insterted into the <head/> element of the resulting Html webpage
  // (as <script src="..."/> and <link rel="style" href="..."/>)
  //
  // Also a website "favicon" URL, if any.
  //
  // Can be an `object` or a `function(url, { store })`.
  //
  // `javascript` and `style` can be strings or objects.
  // If they are objects then one should also provide an `entry` parameter.
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
    // Markup inserted into server rendered webpage's <head/>.
    // Can be either a function returning a value or just a value.
    head: (url, { store }) => String, or React.Element, or an array of React.Elements

    // (optional)
    // Markup inserted to the start of the server rendered webpage's <body/>.
    // Can be either a function returning a value or just a value.
    bodyStart: (url, { store }) => String, or React.Element, or an array of React.Elements
    // (aka `body_start`)

    // (optional)
    // Markup inserted to the end of the server rendered webpage's <body/>.
    // Can be either a function returning a value or just a value.
    bodyEnd: (url, { store }) => String, or React.Element, or an array of React.Elements
    // (aka `body_end`)
  }

  // (optional)
  // Initializes Redux state before performing
  // page preloading and rendering.
  //
  // If defined, this function must return an object
  // which is gonna be the initial Redux state.
  // 
  // `request` is the original HTTP request for the webpage.
  // It can be used, for example, to load the currently
  // logged in user info (user name, user picture, etc).
  //
  initialize: async (httpClient, { request }) => ({})
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

  // Is React Server Side Rendering enabled?
  // (is `true` by default)
  //
  // (does not affect server side routing
  //  and server side page preloading)
  //
  // Can be used to offload React server-side rendering
  // from the server side to the client's web browser
  // (as a performance optimization) by setting it to `false`.
  //
  render: `true`/`false`

  // (optional)
  // Markup for "loading" screen
  // (when server-side rendering is disabled).
  // Can be a String, or a React.Element, or an array of React.Elements
  loading: <div className="loading">Loading...</div>

  // (optional)
  // A custom `log`
  log: bunyan.createLogger(...)
}
```

## Other client-side rendering options

```javascript
{
  ...

  // (optional)
  // `react-router`s `onUpdate` handler
  // (is fired when a user performs navigation)
  // (can be used for Google Analytics, for example)
  onNavigate: (location) => {}

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
  devtools: process.env.REDUX_DEVTOOLS && require('./DevTools.js')

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