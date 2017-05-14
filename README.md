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

(see [webpack-react-redux-isomorphic-render-example](https://github.com/halt-hammerzeit/webpack-react-redux-isomorphic-render-example) or [webapp](https://github.com/halt-hammerzeit/webapp) as references)

Start by creating a settings file (it configures both client side and server side)

#### react-isomorphic-render.js

```javascript
export default {
  // React-Router routes
  routes: require('./src/client/routes'),

  // Redux reducers
  // (they will be combined via `combineReducers()`)
  reducer: require('./src/client/redux/reducers')
}
```

#### ./src/client/redux/reducers/index.js

```js
export { default as reducer1 } from './reducer1'
export { default as reducer2 } from './reducer2'
...
```

Then call `render()` in the main client-side javascript file

#### ./src/client/application.js

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

Notice the `/assets/main.css` and `/assets/main.js` paths: in this example I assume that you're running [`webpack-dev-server`](https://webpack.github.io/docs/webpack-dev-server.html) and this `index.html` file is put into the `build` folder.

Now open `localhost:8080` in a web browser. Client-side rendering should work now. The whole setup can be deployed as-is being uploaded to a cloud and served statically (which is very cheap) – everything would work and adding server-side rendering is not required (though it might be required for better search engine indexing).

## Server side

Adding Server Side Rendering to the setup is quite simple though requiring a running Node.js process therefore the website is no longer just statics served from the cloud but is both statics and a Node.js application running somewhere (say, in a Docker container).

Node.js would perform server-side page rendering and also serving "static files" via HTTP for production mode when `webpack-dev-server` is not running.

`index.html` will be generated on-the-fly by page rendering server for each HTTP request, so the `index.html` file may be deleted as it's of no use now.

Here's how the webpage rendering server is started (also serving assets):

```javascript
import path from 'path'
import webpageServer from 'react-isomorphic-render/server'

// `npm install koa-static koa-mount --save`
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
  // Serves "static files" by `/assets` path
  // from the `../build` folder.
  // Adjust the path to the Webpack `build` folder.
  middleware: [mount('/assets', statics(path.join(__dirname, '../build'), { maxAge }))]
})

// Start webpage rendering server on port 3000
// (`server.listen(port, [host], [callback])`)
server.listen(3000, function(error) {
  if (error) {
    throw error
  }
  console.log(`Webpage rendering server is listening at http://localhost:3000`)
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

Now [disable javascript in Chrome DevTools](http://stackoverflow.com/questions/13405383/how-to-disable-javascript-in-chrome-developer-tools), go to `localhost:3000` and the server should respond with a fully rendered page.

## Proxying

In the example above all HTTP requests to the server are served either with `/assets` "static files" or with HTML pages which is not the case in real-world applications: for example, a request to `/api/items` REST API should return a JSON response from the database.

To accomplish that a proxy server is set up which routes all HTTP requests to their appropriate destination. For example, API requests go to the REST API server, requests for static files return static files, and HTTP requests for webpages are routed to the webpage rendering server. So the HTTP proxying plan would look like this:

 * all HTTP GET requests starting with `/assets` return static files from your `build` folder
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
app.use('/assets', express.static(path.join(__dirname, '../build')))

// Define the REST API
app.get('/api', function(request, response) {
  response.send({ result: true })
})

// Or just extract the REST API into its
// own microservice running on port 3001:
// app.get('/api', function(request, response) {
//   proxy.web(request, response, { target: 'http://localhost:3001' })
// })

// Proxy all other HTTP requests to webpage rendering service
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
    ...

    // Original HTTP request, which is used for
    // getting URL, cloning cookies, and inside `initialize`.
    request,

    // Cookies object having `.get(name)` function
    // (only needed if using `authentication` cookie feature)
    cookies
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

This is a handy way of dealing with "asynchronous actions" in Redux, e.g. Ajax requests for HTTP REST API (see the "HTTP utility" section below).

P.S.: When you find yourself copy-pasting those `_PENDING`, `_SUCCESS` and `_ERROR` event names from one action creator to another then take a look at `asynchronousActionEventNaming` setting described in the [All `react-isomorphic-render.js` settings](https://github.com/halt-hammerzeit/react-isomorphic-render#all-react-isomorphic-renderjs-settings) section of this document: it lets a developer just supply a "base" `event` name and then it generates the three lifecycle event names from that "base" `event` significantly reducing boilerplate.

### HTTP utility

For convenience, the argument of the `promise` function parameter of "asynchronous actions" described above is the built-in `http` utility having methods `get`, `head`, `post`, `put`, `patch`, `delete`, each returning a `Promise` and taking three arguments: the `url` of the HTTP request, `parameters` object, and an `options` object. It can be used to easily query HTTP REST API endpoints in Redux action creators.

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

The possible `options` are

  * `headers` — HTTP Headers JSON object
  * `authentication` — set to `false` to disable sending the authentication token as part of the HTTP request, set to a String to pass it as an `Authorization: Bearer` token
  * `progress(percent, event)` — for tracking HTTP request progress (e.g. file upload)

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

By default, when using `http` utility all JSON responses get parsed for javascript `Date`s which are then automatically converted from `String`s to `Date`s. This is convenient, and also safe because such date `String`s have to be in a very specific ISO format in order to get parsed (`year-month-dayThours:minutes:seconds[timezone]`), but if someone still prefers to disable this feature and have his `String`ified `Date`s back then there's the `parseDates: false` flag in the configuration to opt-out of this feature.

## Page preloading

For page preloading consider using `@preload()` helper to load the neccessary data before the page is rendered.

```javascript
import { connect } from 'react-redux'
import { Title, preload } from 'react-isomorphic-render'

// fetches the list of users from the server
function fetchUsers() {
  return {
    promise: http => http.get('/api/users'),
    events: ['GET_USERS_PENDING', 'GET_USERS_SUCCESS', 'GET_USERS_FAILURE']
  }
}

@preload(({ dispatch }) => dispatch(fetchUsers))
@connect(
  state => ({ users: state.users.users }),
  // `bindActionCreators()` for Redux action creators
  { fetchUsers }
)
export default class Page extends Component {
  render() {
    const { users, fetchUsers } = this.props
    return (
      <div>
        <Title>Users</Title>
        <ul>{ users.map(user => <li>{ user.name }</li>) }</ul>
        <button onClick={ fetchUsers }>Refresh</button>
      </div>
    )
  }
}
```

In the example above `@preload()` helper is called to preload a web page before it is displayed, i.e. before the page is rendered (both on server side and on client side).

[`@preload()` decorator](https://github.com/halt-hammerzeit/react-isomorphic-render/blob/master/source/redux/preload.js) takes a function which must return a `Promise`:

```javascript
@preload(function({ dispatch, getState, location, parameters }) {
  return Promise
})
```

When `dispatch` is called with a special "asynchronous" action (having `promise` and `events` properties, as discussed above) then such a `dispatch()` call will return a `Promise`, that's why in the example above it's written simply as:

```js
@preload(({ dispatch }) => dispatch(fetchUsers))
```

Note: `transform-decorators-legacy` Babel plugin is needed at the moment to make decorators work in Babel:

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

P.S.: if `@preload()` decorator seems not working for no reason (though it definitely should) then try to place it on top of all other decorators. Internally it adds a special static method to your `Route`'s `component` and some decorators on top of it may not retain that static method (though all proper decorators nowadays do retain static methods and variables of wrapped components using [`hoist-non-react-statics`](https://github.com/mridgway/hoist-non-react-statics)).

On the client side, in order for `@preload` to work all `<Link/>`s imported from `react-router` **must** be instead imported from `react-isomorphic-render`. Upon a click on a `<Link/>` first it waits for the next page to preload, and then, when the next page is fully loaded, it is displayed to the user and the URL in the address bar is updated.

`@preload()` also works for Back/Forward web browser buttons navigation. If one `@preload()` is in progress and another `@preload()` starts (e.g. Back/Forward browser buttons) the first `@preload()` will be cancelled if `bluebird` `Promise`s are used in the project and also if `bluebird` is configured for [`Promise` cancellation](http://bluebirdjs.com/docs/api/cancellation.html) (this is an advanced feature and is not required for operation). `@preload()` can be disabled for certain "Back" navigation cases by passing `instantBack` property to a `<Link/>` (e.g. for links on search results pages).

To run `@preload()` only on client side (e.g. when hosting websites statically in the cloud like Amazon S3 and using a separately hosted API like Amazon Lambda) pass the second `{ client: true }` options argument to it

```js
@preload(({ dispatch }) => dispatch(loadContent()), { client: true })
```

Sometimes preloading a page can take some time to finish so one may want to (and actually should) add some kind of a "spinner" to inform the user that the application isn't frozen and the navigation process needs some more time to finish. This can be achieved by adding a Redux reducer listening to these three Redux events:

```javascript
import { PRELOAD_STARTED, PRELOAD_FINISHED, PRELOAD_FAILED } from 'react-isomorphic-render'

export default function(state = {}, action = {}) {
  switch (action.type) {
    case PRELOAD_STARTED  : return { ...state, pending: true,  error: false }
    case PRELOAD_FINISHED : return { ...state, pending: false }
    case PRELOAD_FAILED   : return { ...state, pending: false, error: action.error }
    default               : return state
  }
}
```

And a "spinner" component would look like

```javascript
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { ActivityIndicator } from 'react-responsive-ui'

@connect(state => ({ pending: state.preload.pending }))
export default class Preload extends Component {
  render() {
    const { pending } = this.props
    return (
      <div className={ `preloading ${pending ? 'preloading--shown' : ''}` }>
        <ActivityIndicator className="preloading__spinner"/>
      </div>
    );
  }
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

.preloading__spinner {
  position: absolute;
  left: calc(50% - 2rem);
  top: calc(50% - 2rem);
  width: 4rem;
  height: 4rem;
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

This package uses [react-helmet](https://github.com/nfl/react-helmet) under the hood.

```javascript
import { Title, Meta } from 'react-isomorphic-render'

// Webpage title will be replaced with this one
<Title>Home</Title>

// Adds additional <meta/> tags to the webpage <head/>
<Meta>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"/>
  <meta property="og:title" content="International Bodybuilders Club"/>
  <meta property="og:description" content="Do some push ups"/>
  <meta property="og:locale" content="ru-RU"/>
</Meta>
```

### Handling asynchronous actions

Once one starts writing a lot of Ajax calls in Redux it becomes obvious that there's **a lot** of boilerplate copy-pasting involved. To reduce those tremendous amounts of copy-pasta an "asynchronous action handler" may be used:

#### redux/blogPost.js

```js
import { action, createHandler, stateConnector, eventName } from 'react-isomorphic-render'
// (`./react-isomorphic-render-async.js` settings file is described below)
import settings from './react-isomorphic-render-async'

const handler = createHandler(settings)

// Post comment Redux "action creator"
export const postComment = action({
  namespace: 'BLOG_POST',
  event: 'POST_COMMENT',
  // `action()` must return a `Promise`.
  // Can be an `async` function
  // (`async` functions always return a `Promise`).
  // `http` argument is automatically appended by this library
  // while the `userId`, `blogPostId` and `commentText` arguments
  // must be passed to this action when calling it.
  action(userId, blogPostId, commentText, http) {
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
  // `action()` must return a `Promise`.
  // Can be an `async` function
  // (`async` functions always return a `Promise`).
  // `http` argument is automatically appended by this library
  // while the `blogPostId` argument
  // must be passed to this action when calling it.
  action(blogPostId, http) {
    return http.get(`/blog/posts/${blogPostId}/comments`)
  },
  // The fetched comments will be placed
  // into the `comments` Redux state property.
  result: 'comments'
  // Or write it as a reducer:
  // result: (state, result) => ({ ...state, comments: result })
},
handler)

// A developer can additionally handle any other custom events
handler.handle(eventName('BLOG_POST', 'CUSTOM_EVENT'), (state, action) => ({
  ...state,
  customProperty: action.result
}))

// This is for the Redux `@connect()` helper below.
// Each property name specified here or
// as a `result` parameter of an `action()` definition
// will be made available inside Redux'es
// `@connect(state => ({ ...connector(state.reducerName) }))`.
// This is just to reduce boilerplate when `@connect()`ing
// React Components to Redux state.
// Alternatively, each required property from Redux state
// can be specified manually inside `@connect()` mapper.
handler.addStateProperties('customProperty')

// A little helper for Redux `@connect()`
// which reduces boilerplate when `@connect()`ing
// React Components to Redux state.
// `@connect(state => ({ ...connector(state.reducerName) }))`
// Will add all (known) state properties from
// Redux state to the React Component `props`.
export const connector = stateConnector(handler)

// This is the Redux reducer which now
// handles the asynchronous actions defined above
// (and also the `handler.handle()` events).
// Export it as part of the "root" reducer.
export default handler.reducer()
```

#### redux/reducer.js

```js
// The "root" reducer composed of various reducers.
export { default as blogPost } from './blogPost'
...
```

The React Component would look like this

```js
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { preload } from 'react-isomorphic-render'
import { connector, getComments, postComment } from './redux/blogPost'

// Preload comments before showing the page
// (see "Page preloading" section of this document)
@preload(({ dispatch, getState, parameters }) => {
  // `parameters` are the URL parameters populated by `react-router`:
  // `<Route path="/blog/:blogPostId"/>`.
  return dispatch(getComments(parameters.blogPostId))
})
// See `react-redux` documentation on `@connect()` decorator
@connect((state) => ({
  userId: state.user.id,
  // `...connector()` will populate the Redux `props`
  // with the (known) `state.blogPost` properties:
  //  * `postCommentPending`
  //  * `postCommentError`
  //  * `getCommentsPending`
  //  * `getCommentsError`
  //  * `comments`
  //  * `customProperty`
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
      return <div>Error while loading comments</div>
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
    // `params` are the URL parameters populated by `react-router`:
    // `<Route path="/blog/:blogPostId"/>`.
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
      return <div>Error while posting comment</div>
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

Notice the extraction of these two configuration parameters (`asynchronousActionEventNaming` and `asynchronousActionHandlerStatePropertyNaming`) into a separate file `react-isomorphic-render-async.js`: this is done to break circular dependency on `./react-isomorphic-render.js` file because the `routes` parameter inside `./react-isomorphic-render.js` is the `react-router` `./routes.js` file which `import`s React page components which in turn `import` action creators which in turn would import `./react-isomorphic-render.js` hence the circular (recursive) dependency (same goes for the `reducer` parameter inside `./react-isomorphic-render.js`).

### Handling synchronous actions

For synchronous actions it's the same as for asynchronous ones (as described above):

```js
import { action, createHandler, stateConnector } from 'react-isomorphic-render'
// (`./react-isomorphic-render-async.js` settings file is described above)
import settings from './react-isomorphic-render-async'

const handler = createHandler(settings)

// Displays a notification.
//
// The Redux "action" creator is gonna be:
//
// function(message) {
//   return {
//     type: 'NOTIFICATIONS:NOTIFY',
//     message
//   }
// }
//
// And the corresponding reducer is gonna be:
//
// case 'NOTIFICATIONS:NOTIFY':
//   return {
//     ...state,
//     message: action.message
//   }
//
export const notify = action({
  namespace : 'NOTIFICATIONS',
  event     : 'NOTIFY',
  payload   : message => ({ message }),
  result    : (state, action) => ({ ...state, message: action.message })
},
handler)

// Or, it could be simplified even further:
//
// export const notify = action({
//   namespace : 'NOTIFICATIONS',
//   event     : 'NOTIFY',
//   result    : 'message'
// },
// handler)
//
// Much cleaner.

// A little helper for Redux `@connect()`
export const connector = stateConnector(handler)

// This is the Redux reducer which now
// handles the actions defined above.
export default handler.reducer()
```

### Authorized routes

For authorized routes use the `authorize` helper (kinda "decorator")

```js
import { authorize } from 'react-isomorphic-render'

// Gets `user` from Redux state
const getUser = state => state.authentication.user

// Restricts a `<Route/>` to a certain part of users
const restricted = (route, authorization) => authorize(getUser, authorization, route)

const routes = (
  <Route path="/" component={ Layout }>
    <Route path="public" component={ Public }/>
    <Route path="settings" component={ restricted(UserSettings) }/>
    <Route path="admin" component={ restricted(AdminPanel, user => user.role === 'admin') }/>
    <Route path="only-me" component={ restricted(OnlyMe, user => user.id === 1) }/>
  </Route>
)
```

In order for `authorize` helper to work as intended `settings.catch` handler function parameter **must be specified**. Something like this will do:

```js
{
  ...
  catch(error, { path, url, redirect }) {
    // Not authenticated
    if (error.status === 401) {
      return redirect(`/unauthenticated?url=${encodeURIComponent(url)}`)
    }
    // Not authorized
    if (error.status === 403)
    {
      return redirect(`/unauthorized?url=${encodeURIComponent(url)}`)
    }
    // Redirect to a generic error page
    // (also prevents infinite recursion in case of bugs)
    if (path !== '/error')
    {
      redirect('/error')
    }
    // Some kind of a bug
    throw error
  }
}
```

Also make sure to authorize a user inside REST API endpoints as well, because, say, you set up `authorize` for a restricted page in `routes.js`, but a hacker still can send any REST API HTTP request to the server so if a REST API endpoint doesn't double-check the user's authorization then the whole authorization system is actually considered useless.

### Locale detection

This library performs the following locale detection steps for each webpage rendering HTTP request:

 * Checks the `locale` query parameter (if it's an HTTP GET request)
 * Checks the `locale` cookie
 * Checks the `Accept-Language` HTTP header
 
The resulting locales array is passed as `preferredLocales` argument into `localize()` function parameter of the webpage rendering server which then should return `{ locale, messages }` object in order for `locale` and `messages` to be available as part of the `props` passed to the `wrapper` component which can then pass those to `<IntlProvider/>` in case of using [`react-intl`](https://github.com/yahoo/react-intl) for internationalization.

```js
import React, { Component } from 'react'
import { Provider }         from 'react-redux'
import { IntlProvider }     from 'react-intl'
import { AppContainer }     from 'react-hot-loader'

export default function Wrapper(props) {
  const { store, locale, messages, children } = props
  return (
    <AppContainer>
      <Provider store={store}>
        <IntlProvider locale={locale ? get_language_from_locale(locale) : 'en'} messages={messages}>
          {children}
        </IntlProvider>
      </Provider>
    </AppContainer>
  )
}
```

### Get current location

```js
import React from 'react'

// `withRouter` is available in `react-router@3.0`.
//
// For `2.x` versions just use `this.context.router` property:
// static contextTypes = { router: PropTypes.func.isRequired }
//
import { withRouter } from 'react-router'

// Using `babel-plugin-transform-decorators-legacy`
// https://babeljs.io/docs/plugins/transform-decorators/
@withRouter
export default class Component extends React.Component {
  render() {
    const { router } = this.props
    return <div>{ JSON.stringify(router.location) }</div>
  }
}
```

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

Alternatively, if the current location needs to be changed while still staying at the same page (e.g. a checkbox has been ticked and the corresponding URL query parameter must be added), then use `pushLocation(location, history)` or `replaceLocation(location, history)`.

```javascript
import { pushLocation, replaceLocation } from 'react-isomorphic-render'
import { withRouter } from 'react-router'

@withRouter
class Page extends Component {
  onSearch(query) {
    const { router } = this.props

    pushLocation({
      pathname: router.location.pathname,
      query: {
        query
      }
    }, router)
  }
}
```

## Performance and Caching

React Server Side Rendering is quite slow, so I prefer setting `render: false` flag to move all React rendering to the web browser. This approach has virtually no complications. There are still numerous (effective) approaches to speeding up React Server Side Rendering like leveraging component markup caching and swapping the default React renderer with a much faster stripped down custom one. [Read more](https://github.com/halt-hammerzeit/react-isomorphic-render/blob/master/PERFORMANCE.md).

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

This library attempts to read authentication token from a cookie named `settings.authentication.cookie` (if this setting is configured). If authentication cookie is present then its value will be sent as part of `Authorization: Bearer {token}` HTTP header when using `http` utility in Redux actions.

So, **javascript is required** on the client side in order for this CSRF attacks protection to work (because only javascript can set HTTP headers). If a developer instead prefers to run a website for javascript-disabled users (like [Tor](https://www.deepdotweb.com/)) then no additional set up is needed and just authenticate users in REST API endpoints by "remember me" cookie rather than `Authorization` HTTP header. This will open the website users to various possible javascriptless CSRF attacks.

## Webpack HMR

Webpack's [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) (aka Hot Reload) works for React components and Redux reducers and Redux action creators (it just doesn't work for page `@preload()`s).

HMR setup for Redux reducers is as simple as adding `store.hotReload()` (as shown below). For enabling [HMR on React Components](https://webpack.js.org/guides/hmr-react/) (and Redux action creators) I would suggest the new [react-hot-loader 3](https://github.com/gaearon/react-hot-loader) (which is still in beta, so install it like `npm install react-hot-loader@3.0.0-beta.6 --save`):

#### application.js

```js
import settings from './react-isomorphic-render'

render(settings).then(({ store, rerender }) => {
  if (module.hot) {
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
import React from 'react'
import { Provider } from 'react-redux'
// `react-hot-loader@3`'s `<AppContainer/>`
import { AppContainer } from 'react-hot-loader'

export default function Wrapper({ store, children }) {
  return (
    <AppContainer>
      <Provider store={ store }>
        { children }
      </Provider>
    </AppContainer>
  )
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
    // `react-hot-loader@3` Babel plugin
    "react-hot-loader/babel"
  ]
}
```

#### webpack.config.js

```js
export default {
  entry: {
    main: [
      // This line is required for `react-hot-loader@3`
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

P.S.: Currently it says `Warning: [react-router] You cannot change <Router routes>; it will be ignored` in the browser console. I'm just ignoring this for now, maybe I'll find a proper fix later. Currently I'm using this hacky workaround in `./src/client/application.js`:

```js
/**
 * Warning from React Router, caused by react-hot-loader.
 * The warning can be safely ignored, so filter it from the console.
 * Otherwise you'll see it every time something changes.
 * See https://github.com/gaearon/react-hot-loader/issues/298
 */
if (module.hot) {
  const isString = a => typeof a === 'string';
  const orgError = console.error; // eslint-disable-line no-console
  console.error = (...args) => { // eslint-disable-line no-console
    if (args && args.length === 1 && isString(args[0]) && args[0].indexOf('You cannot change <Router routes>;') > -1) {
      // React route changed
    } else {
      // Log the error as normally
      orgError.apply(console, args);
    }
  };
}
```

## WebSocket

`websocket()` helper sets up a WebSocket connection. 

```js
import { render, websocket } from 'react-isomorphic-render'

render(settings).then(({ store, protectedCookie }) => {
  websocket({
    host: 'localhost',
    port: 80,
    // secure: true,
    store,
    token: protectedCookie
  })
})
```

If `token` parameter is specified then it will be sent as part of every message (providing support for user authentication).

The socket starts listening and upon receiving a `message` having a `type` property such a `message` is `dispatch()`ed as a Redux "action" (e.g. `{ type: 'PRIVATE_MESSAGE', content: 'Testing', from: 123 }`).

WebSocket will autoreconnect (with ["exponential backoff"](https://en.wikipedia.org/wiki/Exponential_backoff)) emitting `open` event every time it does.

After the `websocket()` call a global `websocket` variable is created exposing the following methods:

 * `listen(eventName, function(event, store))`
 * `onOpen(function(event, store))` – is called on `open` event
 * `onClose(function(event, store))` – is called on `close` event
 * `onError(function(event, store))` – is called on `error` event (`close` event always follows the corresponding `error` event)
 * `onMessage(function(message, store))`
 * `send(message)`
 * `close()`

The `store` argument can be used to `dispatch()` Redux "actions".

```js
websocket.onMessage((message, store) => {
  switch (message.command) {
    case 'initialized':
      store.dispatch(connected())
      return console.log('Realtime service connected', message)
    case 'notification':
      return alert(message.text)
    default:
      return console.log('Unknown message type', message)
  }
})

websocket.onOpen((event, store) => {
  websocket.send({ command: 'initialize' })
})

websocket.onClose((event, store) => {
  store.dispatch(disconnected())
})
```

The global `websocket` object also exposes the `socket` property which is the underlying [`robust-websocket`](https://github.com/appuri/robust-websocket) object (for advanced use cases).

As for the server-side counterpart I can recommend using [`uWebSockets`](https://github.com/uWebSockets/uWebSockets)

```js
import WebSocket from 'uws'

const server = new WebSocket.Server({ port: 8888 })

const userConnections = {}

server.on('connection', (socket) => {
  console.log('Incoming WebSocket connection')

  socket.on('close', async () => {
    console.log('Client disconnected')

    if (userConnections[message.userId]) {
      userConnections[message.userId].remove(socket)
    }
  })

  socket.on('message', async (message) => {
    try {
      message = JSON.parse(message)
    } catch (error) {
      return console.error(error)
    }

    try {
      switch (message.command) {
        case 'initialize':

          if (!userConnections[message.userId]) {
            userConnections[message.userId] = []
          }

          userConnections[message.userId].push(socket)

          return socket.send(JSON.stringify({
            command: 'initialized',
            data: ...
          }))

        default:
          return socket.send(JSON.stringify({
            status: 404,
            error: `Unknown command: ${message.command}`
          }))
      }
    } catch (error) {
      console.error(error)
    }
  })
})

server.on('error', (error) => {
  console.error(error)
})

// REST API endpoint exposed for pushing
// notifications via WebSocket.
http.post('/notification', async ({ to, text }) => {
  if (userConnections[to]) {
    for (const socket of userConnections[to]) {
      socket.send(JSON.stringify({
        command: 'notification',
        text
      }))
    }
  }
})
```

## Bundlers

If you're using Webpack then make sure you either build your server-side code with Webpack too (so that asset `require()` calls (images, styles, fonts, etc) inside React components work, see [universal-webpack](https://github.com/halt-hammerzeit/universal-webpack)) or use something like [webpack-isomorphic-tools](https://github.com/halt-hammerzeit/webpack-isomorphic-tools).

## All `react-isomorphic-render.js` settings

```javascript
{
  // React-router routes
  // (either a `<Route/>` element or a
  //  `function({ dispatch, getState })`
  //  returning a `<Route/>` element)
  routes: require('./src/client/routes')

  // Redux reducers (an object)
  reducer: require('./src/client/redux/reducers')
  
  // A React component.
  //
  // Wraps React page component (`children` property)
  // with arbitrary React components.
  // (e.g. Redux `<Provider/>`,
  //  `react-hot-loader@3`'s `<AppContainer/>`
  //  and other "context providers")
  //
  // By default it just wraps everything with Redux'es `<Provider/>`:
  //
  // export default ({ store, children }) => <Provider store={ store }>{ children }</Provider>
  //
  wrapper: require('./src/client/wrapper')

  // (optional)
  // User can add custom Redux middleware
  reduxMiddleware: () => [...]

  // (optional)
  // User can add custom Redux store enhancers
  reduxStoreEnhancers: () => [...]

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
      if (request.url.indexOf('https://my.domain.com') === 0)
      {
        request.set('X-Secret-Token', store.getState().secretToken)
      }
    }

    // (optional)
    // Custom control over `http` utility HTTP requests URL.
    // E.g. for those who don't want to proxy their API calls
    // and instead prefer to query REST API server directly
    // from the web browser (using Cross-Origin Requests).
    // (e.g. when using AWS Lambda).
    // The default `url` formatter only allows "local" URLs
    // to be requested therefore guarding against
    // leaking the authentication token header
    // (e.g. `Authorization: Bearer ${token}`) to a 3rd party.
    // Therefore by supplying a custom `url` formatter
    // a developer takes full responsibility for guarding
    // the authentication token header from being leaked to a 3rd party:
    // when using `http` utility for querying 3rd party API
    // a developer must supply an explicit option `{ authentication: false }`
    // to prevent the authentication token header
    // (e.g. `Authorization: Bearer ${token}`)
    // to be sent to that 3rd party API endpoint.
    url: (path, isServerSide) =>
    {
      // In this case `.application` configuration parameter may be removed
      return `https://api-server.com${path}`
    }

    // (optional)
    // Is called when `http` calls either fail or return an error.
    // Is not called during `@preload()`s and therefore
    // can only be called as part of an HTTP call
    // triggered by some user interaction in a web browser.
    // For example, Auth0 users may listen for JWT token expiration here
    // and either refresh it or redirect to a login page.
    error: (error, { url, path, redirect, dispatch, getState }) => console.error(error)
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
    }
  }

  // (optional)
  // Can handle errors occurring inside `@preload()`.
  // For example, if `@preload()` throws a `new Error("Unauthorized")`
  // then a redirect to "/unauthorized" page can be made here.
  error: (error, { path, url, redirect, dispatch, getState, server }) => redirect(`/error?url=${encodeURIComponent(url)}&error=${error.status}`)

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
  history:
  {
    // (optional)
    // `history` options (like `basename`)
    options: {}

    // (optional)
    // Custom `history` wrapper, like `syncHistoryWithStore` from `react-router-redux`
    wrap: (history, { store }) => history
  }

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

## All webpage rendering server options

```javascript
{
  // Already discussed above
  application,

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
  // Can be an `object` or a function returning an object.
  //
  // `javascript` and `style` can be strings or objects.
  // If they are objects then one should also provide an `entry` parameter.
  // The objects may also contain `common` entry
  // which will also be included on the page.
  //
  assets: (path, { store }) =>
  {
    return {
      javascript: {
        main: '/assets/main.js'
      },

      // (optional)
      styles: {
        main: '/assets/main.css'
      },

      // (optional)
      // URL of your "favicon".
      // If you're using Webpack then the URL is the result of a require() call.
      icon: '/assets/icon.png',

      // Webpack "entry points" to be included for this URL
      entries: ['main']
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
    head: (path, { store }) => String, or React.Element, or an array of React.Elements

    // (optional)
    // Markup inserted to the start of the server rendered webpage's <body/>.
    // Can be either a function returning a value or just a value.
    bodyStart: (path, { store }) => String, or React.Element, or an array of React.Elements
    // (aka `body_start`)

    // (optional)
    // Markup inserted to the end of the server rendered webpage's <body/>.
    // Can be either a function returning a value or just a value.
    bodyEnd: (path, { store }) => String, or React.Element, or an array of React.Elements
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
  // the third property `messagesJSON` (stringified `messages`)
  // to avoid calculating `JSON.stringify(messages)`
  // for each rendered page (a tiny optimization).
  //
  // `preferredLocales` argument is an array
  // of the preferred locales for this user
  // (from the most preferred to the least preferred)
  //
  // `localize()` should normally be a synchronous function.
  // It could be asynchronous though for cases when it's taking
  // messages not from a JSON file but rather from an
  // "admin" user editable database.
  // If the rountrip time (ping) from the rendering service
  // to the database is small enough then it theoretically
  // won't introduce any major page rendering latency
  // (the database will surely cache such a hot query).
  // On the other hand, if a developer fights for each millisecond
  // then `localize()` should just return `messages` from memory.
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

## All client side rendering options

```javascript
{
  ...

  // (optional)
  // Is fired when a user performs navigation (and also on initial page load).
  // This exists mainly for Google Analytics.
  // `url` is a string (`path` + "search" (?...) + "hash" (#...)).
  // "search" query parameters can be stripped in Google Analytics itself.
  // They aren't stripped out-of-the-box because they might contain
  // meaningful data like "/search?query=dogs".
  // http://www.lunametrics.com/blog/2015/04/17/strip-query-parameters-google-analytics/
  // The "hash" part should also be stripped manually inside `onNavigate` function
  // because someone somewhere someday might make use of those "hashes".
  onNavigate: (url, location) => {}

  // (optional)
  // Is called as soon as Redux store is created.
  //
  // For example, client-side-only applications
  // may capture this `store` as `window.store`
  // to call `bindActionCreators()` for all actions (globally).
  //
  // onStoreCreated: store => window.store = store
  //
  // import { bindActionCreators } from 'redux'
  // import actionCreators from './actions'
  // const boundActionCreators = bindActionCreators(actionCreators, window.store.dispatch)
  // export default boundActionCreators
  //
  onStoreCreated: (store) => {}

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
  // is to enable Webpack Hot Module Replacement (aka "hot reload")
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

## Static site generation

In those rare cases when website's content doesn't change at all (or changes very rarely, e.g. a blog) it may be beneficial to host a statically generated version of such a website on a CDN as opposed to hosting a full-blown Node.js application just for the purpose of real-time webpage rendering. In such cases one may choose to generate a static version of the website by snapshotting it on a local machine and then host it in a cloud at virtually zero cost.

First run the website in production (it can be run locally, for example).

Then run the following Node.js script which is gonna snapshot the currently running website and put it in a folder which can be then hosted anywhere.

```sh
# If the website will be hosted on Amazon S3
npm install s3 --save
```

```js
// The following code hasn't been tested so create an issue in case of a bug

import path from 'path'
import { snapshot, upload, S3Uploader, copy, download } from 'react-isomorphic-render/static-site-generator'

import configuration from '../configuration'

let pages =
[
  '/about',
  '/error',
  '/unauthenticated',
  '/unauthorized',
  '/not-found'
]

async function run()
{
  const items = JSON.parse(await download(`https://example.com/api/items`))

  pages = pages.concat(items.map(item => `/items/${item.id}`))

  const output = path.resolve(__dirname, '../static-site')

  // Snapshot the website
  await snapshot
  ({
    host: configuration.host,
    port: configuration.port,
    pages,
    output
  })

  // Copy assets (built by Webpack)
  await copy(path.resolve(__dirname, '../build/assets'), path.resolve(output, 'assets'))

  // Upload the website to Amazon S3
  await upload(output, S3Uploader
  ({
    bucket,
    accessKeyId,
    secretAccessKey,
    region
  }))
}

run().catch((error) =>
{
  console.error(error)
  process.exit(1)
})
```

## For purists

See [PHILOSOPHY](https://github.com/halt-hammerzeit/react-isomorphic-render/blob/master/PHILOSOPHY.md)

## onEnter

`react-router`'s `onEnter` hook is being called twice both on server and client because `react-router`'s `match()` is called before preloading and then the actual navigation happens which triggers the second `match()` call (internally inside `react-router`). This is not considered a blocker because in this library `@preload()` substitutes `onEnter` hooks so just use `@preload()` instead. Double `onEnter` can be fixed using `<RouterContext/>` instead of `<Router/>` but I see no reason to implement such a fix since `onEnter` is simply not used.

## To do

* (minor) Server-side `@preload()` redirection could be rewritten from `throw`ing special "redirection" `Error`s into `.listen()`ing the server-side `MemoryHistory` but since the current "special redirection errors" approach works and has no operational downsides I think that there's no need in such a rewrite.

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