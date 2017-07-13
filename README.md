# react-isomorphic-render

[![npm version](https://img.shields.io/npm/v/react-isomorphic-render.svg?style=flat-square)](https://www.npmjs.com/package/react-isomorphic-render)
[![npm downloads](https://img.shields.io/npm/dm/react-isomorphic-render.svg?style=flat-square)](https://www.npmjs.com/package/react-isomorphic-render)

Server Side Rendering for `React + React-router v3 + Redux` stack.

 * Asynchronously preloads pages before performing client-side navigation
 * Provides an isomorphic HTTP client for calling REST API in Redux ["action creators"](http://redux.js.org/docs/basics/Actions.html)
 * Supports Webpack "hot reload" (aka "Hot Module Replacement")
 * Provides supplementary utilities: locale detection for internationalization, easy setting page `<title/>` and `<meta/>`, programmatic redirects, 100% correct handling of HTTP Cookies, etc

# Why Server Side Rendering

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

# Usage

(see [webpack-react-redux-isomorphic-render-example](https://github.com/halt-hammerzeit/webpack-react-redux-isomorphic-render-example) or [webapp](https://github.com/halt-hammerzeit/webapp) as references)

```bash
$ npm install react-isomorphic-render --save
```

Start by creating a settings file (it configures both client side and server side)

#### react-isomorphic-render.js

```javascript
export default {
  // React-router v3 routes
  routes: require('./src/client/routes'),

  // Redux reducers
  // (they will be combined into the
  //  root reducer via `combineReducers()`)
  reducer: require('./src/client/redux/reducers')
}
```

#### ./src/client/redux/reducers/index.js

```js
export { default as pageOne } from './pageOneReducer'
export { default as pageTwo } from './pageTwoReducer'
...
```

Then call `render()` in the main client-side javascript file.

#### ./src/client/application.js

```javascript
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
  </head>
  <body>
    <div id="react"></div>
    <script src="/bundle.js"></script>
  </body>
</html>
```

Where `bundle.js` is the `./src/client/application.js` file built with Webpack (or you could use any other javascript bundler).

Now, `index.html` and `bundle.js` files must be served over HTTP. If you're using Webpack then place `index.html` to Webpack's `configuration.output.path` folder and run [`webpack-dev-server`](https://webpack.js.org/guides/development/#webpack-dev-server): it will serve `index.html` from disk and `bundle.js` from memory.

Now go to `localhost:8080`. It should respond with the contents of the `index.html` file. Client-side rendering should work now. The whole setup can be deployed as-is being uploaded to a cloud and served statically (which is very cheap).

### Server side

Adding Server Side Rendering to the setup is quite simple though requiring a running Node.js process therefore the website is no longer just statics served from the cloud but is both statics and a Node.js rendering process running somewhere (say, in a Docker container).

`index.html` will be generated on-the-fly by page rendering server for each incoming HTTP request, so the `index.html` file may be deleted as it's of no use now.

```javascript
import webpageServer from 'react-isomorphic-render/server'
import settings from './react-isomorphic-render'

// Create webpage rendering server
const server = webpageServer(settings, {
  // These are the URLs of the "static" javascript and CSS files
  // which are injected in the resulting Html webpage
  // as <script src="..."/> and <link rel="style" href="..."/>.
  // (this is for the main application JS and CSS bundles only,
  //  for injecting 3rd party JS and CSS use `html` settings instead:
  //  https://github.com/halt-hammerzeit/react-isomorphic-render/blob/master/README-ADVANCED.md#all-webpage-rendering-server-options)
  assets() {
    return {
      javascript: 'http://localhost:8080/bundle.js',
      style: 'http://localhost:8080/bundle.css'
    }
  }
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

Now [disable javascript in Chrome DevTools](http://stackoverflow.com/questions/13405383/how-to-disable-javascript-in-chrome-developer-tools), go to `localhost:3000` and the server should respond with a server-side-rendered page.

The `server` variable in the example above is just a [Koa](http://koajs.com/) application, so alternatively it could be started like this:

```js
import http from 'http'
// import https from 'https'
import webpageServer from 'react-isomorphic-render/server'
const server = webpageServer(settings, {...})
http.createServer(server.callback()).listen(80, (error) => ...)
// https.createServer(options, server.callback()).listen(443, (error) => ...)
```

### Serving assets and API

In the examples above "static" files (assets) are served by `webpack-dev-server` on `localhost:8080`. But it's for local development only. For production these "static" files must be served by someone else, be it a dedicated proxy server like NginX, a simple homemade Node.js application or (recommended) a cloud-based solution like Amazon S3.

Also, a real-world website most likely has some kind of an API, which, again, could be either a dedicated API server (e.g. written in Golang), a simple Node.js application or a modern "serverless" API like Amazon Lambda hosted in the cloud.

The following 3 sections illustrate each one of these 3 approaches.

### The simplest approach

This section illustrates the "simple homemade Node.js application" approach. It's not the approach I'd use for a real-world website but it's the simplest one so it's for illustration purposes only.

So, a Node.js process is already running for page rendering, so it could also be employed to perform other tasks like serving "static" files (`webpack-dev-server` is not running in production) or hosting a REST API.

```javascript
import webpageServer from 'react-isomorphic-render/server'
import settings from './react-isomorphic-render'

import path from 'path'
// `npm install koa-static koa-mount --save`
import statics from 'koa-static'
import mount from 'koa-mount'

// Create webpage rendering server
const server = webpageServer(settings, {
  assets: ...,

  // (optional)
  // This parameter is specified here for the example purpose only.
  // Any custom Koa middlewares go here.
  // They are `.use()`d before page rendering middleware.
  middleware: [
    // Serves "static files" on `/assets` URL path from the `../build` folder
    // (the Webpack `configuration.output.path` folder).
    mount('/assets', statics(path.join(__dirname, '../build'), {
      // Cache assets in the web browser for 1 year
      maxAge: 365 * 24 * 60 * 60
    })),
    // Hosts REST API on `/api` URL path.
    mount('/api', async (ctx, next) => {
      ctx.type = 'application/json'
      ctx.body = '{"data":[1,2,3]}'
    })
  ]
})

// Start webpage rendering server on port 3000
...
```

### The old-school way

The old-school way is to set up a "proxy server" like [NginX](https://www.sep.com/sep-blog/2014/08/20/hosting-the-node-api-in-nginx-with-a-reverse-proxy/) dispatching all incoming HTTP requests: serving "static" files, redirecting to the API server for `/api` calls, etc.

```nginx
server {
  # Web server listens on port 80
  listen 80;

  # Serving "static" files (assets)
  location /assets/ {
    root "/filesystem/path/to/static/files";
  }

  # By default everything goes to the page rendering service
  location / {
    proxy_pass http://localhost:3001;
  }

  # Redirect "/api" requests to API service
  location /api {
    rewrite ^/api/?(.*) /$1 break;
    proxy_pass http://localhost:3000;
  }
}
```

Or, alternatively, a quick Node.js proxy server could be made up for development purposes using [http-proxy](https://github.com/nodejitsu/node-http-proxy) library

```js
const path = require('path')
const express = require('express')
const httpProxy = require('http-proxy')

// Use Express or Koa, for example
const app = express()
const proxy = httpProxy.createProxyServer({})

// Serve static files
app.use('/assets', express.static(path.join(__dirname, '../build')))

// Proxy `/api` calls to the API service
app.use('/api', function(request, response) {
  proxy.web(request, response, { target: 'http://localhost:3001' })
})

// Proxy all other HTTP requests to webpage rendering service
app.use(function(request, response) {
  proxy.web(request, response, { target: 'http://localhost:3000' })
})

// Web server listens on port `80`
app.listen(80)
```

### The modern way

Finally, the modern way is not using any "proxy servers" at all. Instead everything is distributed and decentralized. Webpack-built assets are uploaded to the cloud (e.g. Amazon S3) and webpack configuration option `.output.publicPath` is set to something like `https://s3-ap-southeast-1.amazonaws.com/my-bucket/folder-1/` (your CDN URL) so now serving "static" files is not your job – your only job is to upload them to the cloud after Webpack build finishes. API is dealt with in a similar way: CORS headers are set up to allow querying directly from a web browser by an absolute URL and the API is either hosted as a standalone API server or run "serverless"ly, say, on Amazon Lambda, and is queried by an absolute URL, like `https://at9y1jpex0.execute-api.us-east-1.amazonaws.com/develop/users/list`.

This concludes the introductory part of the README and the rest is the description of the various (useful) tools which come prepackaged with this library.

# Tools

## Making HTTP Requests

If a Redux action creator returns an object with a `promise` (function) and `events` (array) then this action is assumed asynchronous.

 * An event of `type = events[0]` is dispatched
 * `promise` function gets called and returns a `Promise`
 * If the `Promise` succeeds then an event of `type = events[1]` is dispatched having `result` property set to the `Promise` result
 * If the `Promise` fails then an event of `type = events[2]` is dispatched having `error` property set to the `Promise` error

Example:

```js
function asynchronousAction() {
  return {
    promise: () => Promise.resolve({ success: true }),
    events: ['PROMISE_PENDING', 'PROMISE_SUCCESS', 'PROMISE_ERROR']
  }
}
```

This is a handy way of dealing with "asynchronous actions" in Redux, e.g. HTTP requests for a server-side HTTP REST API (see the "HTTP utility" section below).

### Autogenerate event names

When you find yourself copy-pasting those `_PENDING`, `_SUCCESS` and `_ERROR` event names from one action creator to another then take a look at `asynchronousActionEventNaming` setting described in the [All `react-isomorphic-render.js` settings](https://github.com/halt-hammerzeit/react-isomorphic-render/blob/master/README-ADVANCED.md#all-react-isomorphic-renderjs-settings) section of the "advanced" readme: it lets a developer just supply a "base" `event` name and then it generates the three lifecycle event names from that "base" `event` significantly reducing boilerplate.

### HTTP utility

For convenience, the argument of the `promise` function parameter of "asynchronous actions" described above is always the built-in `http` utility having methods `get`, `head`, `post`, `put`, `patch`, `delete`, each returning a `Promise` and taking three arguments: the `url` of the HTTP request, `parameters` object, and an `options` object. It can be used to easily query HTTP REST API endpoints in Redux action creators.

```js
function fetchFriends(personId, gender) {
  return {
    promise: (http) => http.get(`/api/person/${personId}/friends`, { gender }),
    events: ['GET_FRIENDS_PENDING', 'GET_FRIENDS_SUCCESS', 'GET_FRIENDS_FAILURE']
  }
}
```

Using ES6 `async/await` this `promise` function can be rewritten as

```js
function fetchFriends(personId, gender) {
  return {
    promise: async (http) => await http.get(`/api/person/${personId}/friends`, { gender }),
    events: ['GET_FRIENDS_PENDING', 'GET_FRIENDS_SUCCESS', 'GET_FRIENDS_FAILURE']
  }
}
```

The possible `options` (the third argument of all `http` methods) are

  * `headers` — HTTP Headers JSON object
  * `authentication` — set to `false` to disable sending the authentication token as part of the HTTP request, set to a String to pass it as an `Authorization: Bearer ${token}` token (no need to set the token explicitly for every `http` method call, it is supposed to be set globally, see below)
  * `progress(percent, event)` — is used for tracking HTTP request progress (e.g. file upload)

<!--
  (removed)
  * `onRequest(request)` – for capturing `superagent` request (there was [a feature request](https://github.com/halt-hammerzeit/react-isomorphic-render/issues/46) to provide a way for aborting running HTTP requests via `request.abort()`)
-->

<!--
`http` utility is also available from anywhere on the client side via an exported `getHttpClient()` function (e.g. for bootstrapping).
-->

### HTTP utility authentication token

In order for `http` utility calls to send an authentication token as part of an HTTP request (the `Authorization: Bearer ${token}` HTTP header) the `authentication.accessToken()` function must be specified in `react-isomorphic-render.js`.

```js
{
  authentication: {
    accessToken(getCookie, { store, path, url }) {
      // (make sure the access token is not leaked to a third party)
      return getCookie('accessToken')
      return localStorage.getItem('accessToken')
      return store.getState().authentication.accessToken
    }
  }
}
```

### HTTP utility and URLs

All URLs queried via `http` utility must be relative ones (e.g. `/api/users/list`). In order to transform these relative URLs into absolute ones there are two approaches.

The first approach is for people using a proxy server (minority). In this case all client-side HTTP requests will still query relative URLs which are gonna hit the proxy server and the proxy server will route them to their proper destination. And the server side is gonna query the proxy server directly (there is no notion of "relative URLs" on the server side) therefore the proxy `host` and `port` need to be configured in webpage rendering service options.

```js
const server = webpageServer(settings, {
  proxy: {
    host: '192.168.0.1',
    port: 3000,
    // (enable for HTTPS protocol)
    // secure: true
  }
})
```

The second approach is for everyone else (majority). In this case all URLs are transformed from relative ones into absolute ones by the `http.url(path)` function parameter configured in `react-isomorphic-render.js`.

```js
{
  http: {
    url: path => `https://api.server.com${path}`
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

By default, when using `http` utility all JSON responses get parsed for javascript `Date`s which are then automatically converted from `String`s to `Date`s. This is convenient, and also safe because such date `String`s have to be in a very specific ISO format in order to get parsed (`year-month-dayThours:minutes:seconds[timezone]`), but if someone still prefers to disable this feature and have their `String`ified `Date`s back then there's the `parseDates: false` flag in the configuration to opt-out of this feature.

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
@preload(function({ dispatch, getState, location, parameters, server }) {
  return Promise.resolve()
})
```

Alternatively, `async/await` syntax may be used:

```javascript
@preload(async ({ dispatch, getState, location, parameters, server }) => {
  await fetchWhatever(parameters.id)
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

On the client side, in order for `@preload` to work all `<Link/>`s imported from `react-router` **must** be instead imported from `react-isomorphic-render`. Upon a click on a `<Link/>` first it waits for the next page to preload, and then, when the next page is fully loaded, it is displayed to the user and the URL in the address bar is updated.

`@preload()` also works for Back/Forward web browser buttons navigation. If one `@preload()` is in progress and another `@preload()` starts (e.g. Back/Forward browser buttons) the first `@preload()` will be cancelled if `bluebird` `Promise`s are used in the project and also if `bluebird` is configured for [`Promise` cancellation](http://bluebirdjs.com/docs/api/cancellation.html) (this is an advanced feature and is not required for operation). `@preload()` can be disabled for certain "Back" navigation cases by passing `instantBack` property to a `<Link/>` (e.g. for links on search results pages).

To run `@preload()` only on client side pass the second `{ client: true }` options argument to it

```js
@preload(({ dispatch }) => dispatch(loadContent()), { client: true })
```

For example, a web application could be hosted entirely statically in a cloud like Amazon S3 and fetch data using a separately hosted API like Amazon Lambda. This kind of setup is quite popular due to being simple and cheap. Yes, it's not a true isomorphic approach because the user is given a blank page first and then some `main.js` script fetches the page data in the browser. But, as being said earlier, this kind of setup is rediculously simple to build and cheap to maintain so why not. Yes, Google won't index such websites, but if searchability is not a requirement (yet) then it's the way to go (e.g. "MVP"s).

Specifying `{ client: true }` option for each `@preload()` would result in a lot of copy-pasta so there's a [special configuration option](https://github.com/halt-hammerzeit/react-isomorphic-render/blob/master/README-ADVANCED.md#all-react-isomorphic-renderjs-settings) for that: `{ preload: { client: true } }`.

### `@preload()` indicator

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
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 0;
  opacity: 0;
  transition: opacity 100ms ease-out, z-index 100ms step-end;
}

.preloading--shown {
  z-index: 1;
  opacity: 1;
  transition: opacity 600ms ease-out 500ms, z-index 0ms step-start;
  cursor: wait;
}

.preloading__spinner {
  position: absolute;
  left: calc(50% - 2rem);
  top: calc(50% - 2rem);
  width: 4rem;
  height: 4rem;
  color: white;
}
```

## Page HTTP response status code

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

### Setting <title/> and <meta/> tags

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
  <meta property="og:description" content="This page explains how to do some simple push ups"/>
  <meta property="og:image" content="https://www.google.ru/images/branding/googlelogo/2x/googlelogo_color_120x44dp.png"/>
  <meta property="og:locale" content="ru_RU"/>
</Meta>
```

### Handling asynchronous actions

Once one starts writing a lot of `http` calls in Redux actions it becomes obvious that there's **a lot** of copy-pasting involved. To reduce those tremendous amounts of copy-pasta an "asynchronous action handler" may be used:

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
  if (message.command) {
    switch (message.command) {
      case 'initialized':
        store.dispatch(connected())
        return console.log('Realtime service connected', message)
      case 'notification':
        return alert(message.text)
      default:
        return console.log('Unknown message type', message)
    }
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

  socket.sendMessage = (message) => socket.send(JSON.stringify(message))

  socket.on('close', async () => {
    console.log('Client disconnected')

    if (socket.userId) {
      userConnections[socket.userId].remove(socket)
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
          // If a user connected (not a guest)
          // then store `userId` for push notifications.
          // Using an authentication token here
          // instead of simply taking `userId` out of the `message`
          // because the input can't be trusted (could be a hacker).
          if (message.userAuthenticationToken) {
            // (make sure `socket.userId` is a `String`)
            // The token could be a JWT token (jwt.io)
            // and `authenticateUserByToken` function could
            // check the token's authenticity (by verifying its signature)
            // and then extract `userId` out of the token payload.
            socket.userId = authenticateUserByToken(message.userAuthenticationToken)

            if (!userConnections[socket.userId]) {
              userConnections[socket.userId] = []
            }

            userConnections[socket.userId].push(socket)
          }

          return socket.sendMessage({
            command: 'initialized',
            data: ...
          })

        default:
          return socket.sendMessage({
            status: 404,
            error: `Unknown command: ${message.command}`
          })
      }
    } catch (error) {
      console.error(error)
    }
  })
})

server.on('error', (error) => {
  console.error(error)
})

// Also an HTTP server is started and a REST API endpoint is exposed
// which can be used for pushing notifications to clients via WebSocket.
// The HTTP server must only be accessible from the inside
// (i.e. not listening on an external IP address, not proxied to)
// otherwise an attacker could push any notifications to all users.
// Therefore, only WebSocket connections should be proxied (e.g. using NginX).
httpServer().handle('POST', '/notification', ({ to, text }) => {
  if (userConnections[to]) {
    for (const socket of userConnections[to]) {
      socket.sendMessage({
        command: 'notification',
        text
      })
    }
  }
})
```

Feature: upon receiving a `message` (on the client side) having a `type` property defined such a `message` is `dispatch()`ed as a Redux "action" (this can be disabled via `autoDispatch` option). For example, if `{ type: 'PRIVATE_MESSAGE', content: 'Testing', from: 123 }` is received on a websocket connection then it is automatically `dispatch()`ed as a Redux "action". Therefore, the above example could be rewritten as

```js
// Server side (REST API endpoint)
socket.sendMessage({
  type: 'DISPLAY_NOTIFICATION',
  text
})

// Client side (Redux reducer)
function reducer(state, action) {
  switch (action.type) {
    case 'DISPLAY_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.concat([action.text])
      }
    default:
      return state
  }
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

// Index page is added by default
let pages =
[
  '/about',

  { url: '/unauthenticated', status: 401 },
  { url: '/unauthorized', status: 403 },
  { url: '/not-found', status: 404 },
  { url: '/error', status: 500 }
]

async function run()
{
  const { status, content } = JSON.parse(await download(`https://example.com/api/items`))

  if (status !== 200)
  {
    throw new Error('Couldn\'t load items')
  }

  const items = JSON.parse(content)

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

## Bundlers

If you're using Webpack then make sure you either build your server-side code with Webpack too (so that asset `require()` calls (images, styles, fonts, etc) inside React components work, see [universal-webpack](https://github.com/halt-hammerzeit/universal-webpack)) or use something like [webpack-isomorphic-tools](https://github.com/halt-hammerzeit/webpack-isomorphic-tools).

## Advanced

At some point in time this README became huge so I extracted some less relevant parts of it into [README-ADVANCED](https://github.com/halt-hammerzeit/react-isomorphic-render/blob/master/README-ADVANCED.md) (including the list of all possible settings and options). If you're a first timer then just skip that one.

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