# react-website

[![npm version](https://img.shields.io/npm/v/react-website.svg?style=flat-square)](https://www.npmjs.com/package/react-website)
[![npm downloads](https://img.shields.io/npm/dm/react-isomorphic-render.svg?style=flat-square)](https://www.npmjs.com/package/react-website)
[![npm downloads](https://img.shields.io/npm/dm/react-website.svg?style=flat-square)](https://www.npmjs.com/package/react-website)

A complete solution for building a React/Redux application

* Routing
* Page preloading
* (optional) Server-side rendering
* Asynchronous HTTP requests
* Extremely reduced Redux verbosity
* Document metadata (`<title/>`, `<meta/>`, social network sharing)
* Internationalization
* Webpack "hot reload"
* HTTP Cookies
* etc

# Introduction

## Getting started

```bash
$ npm install redux react-redux --save
$ npm install react-router@3 --save
$ npm install react-website --save
```

Start by creating the configuration file

#### ./react-website.js

```javascript
// React-router v3 routes
import routes from './src/routes'

// Redux reducers
// (they will be combined into the
//  root Redux reducer via `combineReducers()`)
import reducers from './src/redux/index'

export default {
  routes,
  reducers
}
```

#### ./src/routes.js

```js
import React from 'react'
// `react-router@3`
import { Route, IndexRoute } from 'react-router'

import App from './pages/App'
import Home from './pages/Home'
import About from './pages/About'

export default (
  <Route path="/" component={ App }>
    <IndexRoute component={ Home }/>
    <Route path="about" component={ About }/>
  </Route>
)
```

#### ./src/pages/App.js

```js
import React from 'react'
import { IndexLink, Link } from 'react-website'

export default ({ children }) => (
  <div>
    <h1> Web Application </h1>
    <ul>
      <li> <IndexLink> Home </IndexLink> </li>
      <li> <Link to="/about"> About </Link> </li>
    </ul>
    { children }
  </div>
)
```

#### ./src/pages/Home.js

```js
import React from 'react'

export default () => <div> This is a home page </div>
```

#### ./src/pages/About.js

```js
import React from 'react'

export default () => <div> Made using `react-website` </div>
```

#### ./src/redux/index.js

```js
// For those who're unfamiliar with Redux,
// a reducer is a function `(state, action) => state`.
export { default as homePage } from './homePageReducer'
export { default as aboutPage } from './aboutPageReducer'
...
```

Then call `render()` in the main client-side javascript file.

#### ./src/index.js

```javascript
import { render } from 'react-website'
import settings from './react-website'

// Render the page in web browser
render(settings)
```

And the `index.html` would look like this:

```html
<html>
  <head>
    <title>react-website</title>
  </head>
  <body>
    <div id="react"></div>
    <script src="/bundle.js"></script>
  </body>
</html>
```

Where `bundle.js` is the `./src/index.js` file built with Webpack (or you could use any other javascript bundler).

Now, `index.html` and `bundle.js` files must be served over HTTP(S). If you're using Webpack then place `index.html` to Webpack's `configuration.output.path` folder and run [`webpack-dev-server`](https://webpack.js.org/guides/development/#webpack-dev-server) in a terminal: it will serve `index.html` from disk and `bundle.js` from memory.

Now go to `localhost:8080`. It should respond with a fully working website.

The application (`index.html`, `bundle.js`) can now be deployed as-is in a cloud (e.g. on Amazon S3) and served statically for a very low price. The API can be hosted "serverlessly" in a cloud (e.g. Amazon Lambda) which is also considered cheap. No running Node.js server is required. Yes, it's not a Server-Side Rendered approach because a user is given a blank page first, then `bundle.js` script is loaded by the web browser, then this script is executed and it fetches the data for the page from the API, and only then the page is rendered (in the browser). Google won't index such websites, but if searchability is not a requirement (at all or yet) then that would be the way to go (e.g. startup "MVP"s or "internal applications"). Server-Side Rendering can be easily added to such setup should the need arise.

## Server Side Rendering

### Search engines

Search engine crawlers like Google bot won't wait for a page to make its asynchronous HTTP calls to an API server for data: they would simply abort all **asynchronous** javascript and index the page as is. Don't mistake it for web crawlers not being able to execute javascript — they're [perfectly fine](http://andrewhfarmer.com/react-seo/) with doing that ([watch out though](https://blog.codaxy.com/debugging-googlebot-crawl-errors-for-javascript-applications-5d9134c06ee7) for using the latest javascript language features and always use polyfills for the older browsers since web crawlers may be using those under the hood).

So the only thing preventing a dynamic website from being indexed by a crawler is asynchronous HTTP queries for data, not javascript itself. This therefore brings two solutions: one is to perform everything (routing, data fetching, rendering) on the server side and the other is to perform routing and data fetching on the server side leaving rendering to the client's web browser. Both these approaches work with web crawlers. And this is what this library provides.

While the first approach is more elegant and pure, while also delivering the fastest "time to first byte", currently it is a CPU intensive task to render a complex React page (takes about 30 milliseconds of blocking CPU single core time for complex pages having more than 1000 components, as of 2017). Therefore one may prefer the second approach: performing routing and page preloading on the server side while leaving page rendering to the client. This means that the user won't see any content until the javascript bundle is downloaded (which takes some time, especially with large applications not using "code splitting"), but it also means that the server's CPU is freed from rendering React. This mode is activated by passing `hollow: true` flag to the rendering server.

### Page loading time

Another argument in favour of Server-Side Rendering is that even if a website doesn't need search engine indexing it could still benefit from saving that additional asynchronous HTTP roundtrip from the web browser to the API server for fetching the page's data. And no matter how fast the API server is, [latency is unbeatable](https://www.igvita.com/2012/07/19/latency-the-new-web-performance-bottleneck/) being about 100ms. So, by performing routing and page preloading on the server side one can speed up website loading by about 100ms.

### Adding server-side rendering

Not everyone needs server-side rendering for their apps. E.g. if search engine indexing is not a priority, or if a website is a "static" one, like a "promosite" or a "personal portfolio" (just build it with a bundler and host it as a bunch of files in a cloud).

Adding server-side rendering to the setup is quite simple though requiring a Node.js process running which increases hosting costs and maintenance complexity.

In case of server-side rendering `index.html` is being generated on-the-fly by page rendering server for each incoming HTTP request, so the `index.html` file may be deleted as it's of no use now.

#### ./rendering-server.js

```javascript
import webpageServer from 'react-website/server'
import settings from './react-website'

// Create webpage rendering server
const server = webpageServer(settings, {
  // Pass `secure: true` for HTTPS.
  //
  // These are the URLs of the "static" javascript and CSS files
  // which are injected in the resulting Html webpage
  // as <script src="..."/> and <link rel="style" href="..."/>.
  // (this is for the main application JS and CSS bundles only,
  //  for injecting 3rd party JS and CSS use `html` settings instead:
  //  https://github.com/catamphetamine/react-website/blob/master/README-ADVANCED.md#all-webpage-rendering-server-options)
  assets() {
    return {
      // Assuming that it's being tested on a local computer first
      // therefore using "localhost" URLs.
      javascript: 'http://localhost:8080/bundle.js',
      // (optional) If using a separate CSS bundle:
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

Run the rendering server:

```
$ npm install npx --global
$ npm install babel-cli
$ npx babel-node rendering-server.js
```

Now [disable javascript in Chrome DevTools](http://stackoverflow.com/questions/13405383/how-to-disable-javascript-in-chrome-developer-tools), go to `localhost:3000` and the server should respond with a fully server-side-rendered page.

## Conclusion

This concludes the introductory part of the README and the rest is the description of the various tools and techniques which come prepackaged with this library.

A working example illustrating Server-Side Rendering and all other things can be found here: [webpack-react-redux-isomorphic-render-example](https://github.com/catamphetamine/webpack-react-redux-isomorphic-render-example).

# Documentation

## Preloading pages

For page preloading use the `@preload()` decorator to load the neccessary data before the page is rendered.

```javascript
import { connect } from 'react-redux'
import { preload } from 'react-website'

// Redux "asynchronous action", 
// explained later in this document.
function fetchUsers() {
  return {
    promise: ({ http }) => http.get('/api/users'),
    events: ['FETCH_USERS_PENDING', 'FETCH_USERS_SUCCESS', 'FETCH_USERS_FAILURE']
  }
}

@preload(async ({ dispatch }) => {
  // Send HTTP request and wait for response
  await dispatch(fetchUsers())
})
@connect(
  (state) => ({ users: state.usersPage.users }),
  // Calls `bindActionCreators()`
  // for the specified Redux action creators.
  { fetchUsers }
)
export default class UsersPage extends Component {
  render() {
    const { users, fetchUsers } = this.props
    return (
      <div>
        <ul> { users.map(user => <li> { user.name } </li>) } </ul>
        <button onClick={ fetchUsers }> Refresh </button>
      </div>
    )
  }
}
```

In this example the `@preload()` decorator is used to preload a page before it is displayed, i.e. before the page is rendered (both on server side and on client side).

`@preload()` decorator takes an `async`/`await` function which takes an object of arguments:

```javascript
@preload(async (preloadArguments) => {
  const = {
    // Redux `dispatch()`
    dispatch,
    // Get Redux state
    getState,
    // Current page location
    location,
    // `react-router` URL `params`
    // (e.g. '/users/:id')
    parameters,
    // Is this server side rendering
    server,
    // Is this the initial page preload in a web browser
    initial
  }
  = preloadArguments
  
  // Send HTTP request and wait for response.
  await dispatch(fetchPageData(parameters.id))
})
```

<details>
<summary>The decorator also receives an optional `options` argument (advanced topic)</summary>

* `blocking` — If `false` then child `<Route/>`'s  `@preload()`s will not wait for this `@preload()` to finish in order to get executed (`blocking` is `true` by default).

* `blockingSibling` — If `true` then all further adjacent (sibling) `@preload()`s for the same `<Route/>`'s component will wait for this `@preload()` to finish in order to get executed. (is `false` by default).

* `client` — If `true` then the `@preload()` will be executed only on client side. If `false` then this `@preload()` will be executed normally: if part of initial page preloading then on server side and if part of subsequent preloading (e.g. navigation) then on client side. `false` is the default value unless overridden by `preload.client` configuration parameter.

* `server` — If `true` then the `@preload()` will be executed only on server side. If `false` then this `@preload()` will be executed normally: if part of initial page preloading then on server side and if part of subsequent preloading (e.g. navigation) then on client side. `false` is the default value unless overridden by `preload.client` configuration parameter.
</details>

####

Note: `transform-decorators-legacy` Babel plugin is needed at the moment to make decorators work with Babel:

```sh
npm install babel-plugin-transform-decorators-legacy --save
```

#### .babelrc

```js
{
  ...
  "plugins": [
    "transform-decorators-legacy",
    ...
  ]
}
```

On the client side, in order for `@preload` to work all `<Link/>`s imported from `react-router` **must** be instead imported from `react-website`. Upon a click on a `<Link/>` first it waits for the next page to preload, and then, when the next page is fully loaded, `react-router` navigation itself takes place.

`@preload` also works for Back/Forward navigation.

## `@preload()` indicator

Sometimes preloading a page can take some time so one may want to (and actually should) add some kind of a "spinner" to inform the user that the application isn't frozen and that the navigation process needs some more time to finish. This can be achieved by adding the built-in `<Loading/>` component on a page:

```javascript
import { Loading } from 'react-website'
// Using Webpack CSS loader
import 'react-website/components/Loading.css'
import 'react-website/components/LoadingIndicator.css'

export default function Application() {
  return (
    <div>
      ....
      <Loading/>
    </div>
  )
}
```

The `<Loading/>` component takes an optional `indicator` property which can be a React component accepting a `className` property and which is a white circular spinner by default.

## Asynchronous actions

Implementing synchronous actions in Redux is straightforward. But what about asynchronous actions like HTTP requests? Redux itself doesn't provide any built-in solution for that leaving it to 3rd party middlewares. Therefore this library provides one.

### Pure Promises

This is the lowest-level approach to asynchronous actions. It is described here just for academic purposes and most likely won't be used directly in any app.

If a Redux "action creator" returns an object with a `promise` (function) and `events` (array) then `dispatch()`ing such an action results in the following steps:

 * An event of `type = events[0]` is dispatched
 * `promise` function gets called and returns a `Promise`
 * If the `Promise` succeeds then an event of `type = events[1]` is dispatched having `result` property set to the `Promise` result
 * If the `Promise` fails then an event of `type = events[2]` is dispatched having `error` property set to the `Promise` error

```js
function asynchronousAction() {
  return {
    promise: () => Promise.resolve({ success: true }),
    events: ['PROMISE_PENDING', 'PROMISE_SUCCESS', 'PROMISE_ERROR']
  }
}
```

`dispatch(asynchronousAction())` call returns the `Promise` itself:

```js
@preload(async ({ dispatch }) => {
  await dispatch(asynchronousAction())
})
```

### HTTP utility

Because in almost all cases dispatching an "asynchronous action" means "making an HTTP request", the `promise` function described above always takes an `http` utility parameter: `promise: ({ http }) => ...`.

The `http` utility has the following methods:

* `head`
* `get`
* `post`
* `put`
* `patch`
* `delete`

Each of these methods returns a `Promise` and takes three arguments:

* the `url` of the HTTP request
* `parameters` object (e.g. HTTP GET `query` or HTTP POST `body`)
* `options` (described further)

So, API endpoints can be queried using `http` and ES6 `async/await` syntax like so:

```js
function fetchFriends(personId, gender) {
  return {
    promise: async ({ http }) => await http.get(`/api/person/${personId}/friends`, { gender }),
    events: ['GET_FRIENDS_PENDING', 'GET_FRIENDS_SUCCESS', 'GET_FRIENDS_FAILURE']
  }
}
```

####

The possible `options` (the third argument of all `http` methods) are

  * `headers` — HTTP Headers JSON object
  * `authentication` — set to `false` to disable sending the authentication token as part of the HTTP request, set to a String to pass it as an `Authorization: Bearer ${token}` token (no need to set the token explicitly for every `http` method call, it is supposed to be set globally, see below)
  * `progress(percent, event)` — is used for tracking HTTP request progress (e.g. file upload)
  * `onResponseHeaders(headers)` – for examining HTTP response headers (e.g. [Amazon S3](http://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPUT.html#RESTObjectPUT-responses-response-headers) file upload)

<!--
  (removed)
  * `onRequest(request)` – for capturing `superagent` request (there was [a feature request](https://github.com/catamphetamine/react-website/issues/46) to provide a way for aborting running HTTP requests via `request.abort()`)
-->

<!--
`http` utility is also available from anywhere on the client side via an exported `getHttpClient()` function (e.g. for bootstrapping).
-->

### Redux module

Once one starts writing a lot of `promise`/`http` Redux actions it becomes obvious that there's a lot of copy-pasting and verbosity involved. To reduce those tremendous amounts of copy-pasta "redux module" tool may be used which:

* Also gives access to `http`
* Autogenerates Redux action status event names ("pending", "success", "error")
* Automatically populates the corresponding action status properties ("pending", "success", "error") in Redux state
* Automatically adds Redux reducers for the action status events

For example, the `fetchFriends()` action from the previous section can be rewritten as:

Before:

```js
// ./actions/friends.js
function fetchFriends(personId, gender) {
  return {
    promise: ({ http }) => http.get(`/api/person/${personId}/friends`, { gender }),
    events: ['FETCH_FRIENDS_PENDING', 'FETCH_FRIENDS_SUCCESS', 'FETCH_FRIENDS_FAILURE']
  }
}

// ./reducers/friends.js
export default function(state = {}, action = {}) {
  switch (action.type) {
    case 'FETCH_FRIENDS_PENDING':
      return {
        ...state,
        fetchFriendsPending: true,
        fetchFriendsError: null
      }
    case 'FETCH_FRIENDS_SUCCESS':
      return {
        ...state,
        fetchFriendsPending: false,
        friends: action.value
      }
    case 'FETCH_FRIENDS_ERROR':
      return {
        ...state,
        fetchFriendsPending: false,
        fetchFriendsError: action.error
      }
    default
      return state
  }
}
```

After:

```js
import { reduxModule } from 'react-website'

const redux = reduxModule('FRIENDS')

export const fetchFriends = redux.action(
  'FETCH_FRIENDS',
  async ({ http }, personId, gender) => {
    return await http.get(`/api/person/${personId}/friends`, { gender })
  },
  // The fetched friends list will be placed
  // into the `friends` Redux state property.
  'friends'
  // 
  // Or write it like this:
  // { friends: result => result }
  //
  // Or write it as a Redux reducer:
  // (state, result) => ({ ...state, friends: result })
)

// This is the Redux reducer which now
// handles the asynchronous action defined above.
export default redux.reducer()
```

Much cleaner.

<details>
<summary>
  Here's a more complex example: a comments section for a blog post page.
</summary>

#### redux/blogPost.js

```js
import { reduxModule, eventName } from 'react-website'

const redux = reduxModule('BLOG_POST')

// Post comment Redux "action creator"
export const postComment = redux.action(
  'POST_COMMENT',
  async ({ http }, userId, blogPostId, commentText) => {
    // The last `{ http }` argument is automatically appended by this library.
    // The original action call looks like:
    // `dispatch(postComment(1, 12345, 'bump'))`
    return await http.post(`/blog/posts/${blogPostId}/comment`, {
      userId: userId,
      text: commentText
    })
  }
)

// Get comments Redux "action creator"
export const getComments = redux.action(
  'GET_COMMENTS',
  async ({ http }, blogPostId) => {
    return await http.get(`/blog/posts/${blogPostId}/comments`)
  },
  // The fetched comments will be placed
  // into the `comments` Redux state property.
  'comments'
  // 
  // Or write it like this:
  // { comments: result => result }
  //
  // Or write it as a Redux reducer:
  // (state, result) => ({ ...state, comments: result })
)

// A developer can additionally handle any other custom events
redux.on(eventName('BLOG_POST', 'CUSTOM_EVENT'), (state, action) => ({
  ...state,
  reduxStateProperty: action.value
}))

// This is for the Redux `@connect()` helper below.
// Each property name specified here or
// as a `result : String` argument of a `redux.action()` call
// will be made available inside Redux'es
// `@connect(state => connectComments(state.reducerName))`.
// This is just to reduce boilerplate when `@connect()`ing
// React Components to Redux state.
// Alternatively, each required property from Redux state
// can be specified manually inside `@connect()` mapper.
redux.property('reduxStateProperty')

// A little helper for Redux `@connect()`
// which reduces boilerplate when `@connect()`ing
// React Components to Redux state:
// `@connect(state => connectComments(state.reducerName))`
// will add all (known) state properties from
// Redux state to React Component `props`.
// Alternatively, each required property from Redux state
// can be specified manually inside `@connect()` mapper.
export const connectComments = redux.getProperties

// This is the Redux reducer which now
// handles the asynchronous actions defined above
// (and also the `handler.on()` events).
// Export it as part of the "main" reducer.
export default redux.reducer()
```

#### redux/reducer.js

```js
// The "main" reducer composed of various reducers.
export { default as blogPost } from './blogPost'
...
```

The React Component would look like this

```js
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { preload } from 'react-website'
import { connectComments, getComments, postComment } from './redux/blogPost'

// Preload comments before showing the page
// (see "Page preloading" section of this document)
@preload(async ({ dispatch, parameters }) => {
  // `parameters` are the URL parameters populated by `react-router`:
  // `<Route path="/blog/:blogPostId"/>`.
  await dispatch(getComments(parameters.blogPostId))
})
// See `react-redux` documentation on `@connect()` decorator
@connect((state) => ({
  userId: state.user.id,
  // `...connectComments(...)` will populate `this.props`
  // with the (known) Redux `state.blogPost` properties:
  //  * `postCommentPending`
  //  * `postCommentError`
  //  * `getCommentsPending`
  //  * `getCommentsError`
  //  * `comments`
  //  * `customProperty`
  ...connectComments(state.blogPost)
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
</details>

####

Redux module can also handle synchronous actions along with asynchronous ones, should the need arise.

<details>
<summary>See how</summary>

```js
import { reduxModule } from 'react-website'

const redux = reduxModule('NOTIFICATIONS')

// Displays a notification.
//
// The Redux "action" creator is gonna be:
//
// function(text) {
//   return {
//     type    : 'NOTIFICATIONS:NOTIFY',
//     message : formatMessage(text)
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
// Call it as `dispatch(notify(text))`.
//
export const notify = redux.action(
  'NOTIFY',
  // The action
  (text) => formatMessage(text),
  // The Redux state reducer for the action's return value
  (state, message) => ({ ...state, message }),
  // The Redux reducer above could be also defined as
  // 'message',
  // Indicates this is a "synchronous" action (not "asynchronous")
  { sync : true }
)

// (optional) a little helper for Redux `@connect()`
export const properties = redux.getProperties

// This is the Redux reducer which now
// handles the actions defined above.
export default redux.reducer()
```
</details>

### HTTP authentication

In order for `http` utility calls to send an authentication token as part of an HTTP request (the `Authorization: Bearer ${token}` HTTP header) the `authentication.accessToken()` function must be specified in `react-website.js`.

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

### HTTP request URLs

All URLs queried via `http` utility are supposed to be relative ones (e.g. `/api/users/list`) for convenience. In order to transform these convenient relative URLs into real ones there are two approaches built-in.

<details>
<summary>The old-school approach is for people using a proxy server.</summary>

In this case all client-side HTTP requests will still query relative URLs which are gonna hit the proxy server and the proxy server will route them to the API service. And on server side it's gonna query the proxy server by an absolute URL (there is no notion of "relative URLs" on the server side) therefore the proxy `host` and `port` need to be configured in webpage rendering service options.

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
</details>

####

The modern approach is to query API by an absolute URL (through CORS) in a cloud. In this case all URLs are transformed from relative ones into absolute ones by the `http.url(path)` parameter configured in `react-website.js`.

```js
{
  http: {
    url: path => `https://api-service.cloud-provider.com${path}`
  }
}
```

### File upload

The `http` utility will also upload files if they're passed as part of `parameters` (see example below). The files passed inside `parameters` must have one of the following types:

* In case of a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) it will be a single file upload.
* In case of a [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList) with a single `File` inside it would be treated as a single `File`.
* In case of a `FileList` with multiple `File`s inside a multiple file upload will be performed.
* In case of an `<input type="file"/>` DOM element all its `.files` will be taken as a `FileList` parameter.

File upload progress can be metered by passing `progress` option as part of the `options` .

<details>
<summary>See example</summary>

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
    promise: ({ http }) => http.post(
      '/item/photo',
      { itemId, file },
      { progress(percent) { console.log(percent) } }
    ),
    events: ['UPLOAD_ITEM_PHOTO_PENDING', 'UPLOAD_ITEM_PHOTO_SUCCESS', 'UPLOAD_ITEM_PHOTO_FAILURE']
  }
}
```
</details>

### JSON Date parsing

By default, when using `http` utility all JSON responses get parsed for javascript `Date`s which are then automatically converted from `String`s to `Date`s. This is convenient, and also safe because such date `String`s have to be in a very specific ISO format in order to get parsed (`year-month-dayThours:minutes:seconds[timezone]`, e.g. `2017-12-22T23:03:48.912Z`), but if someone still prefers to disable this feature and have their stringified dates untouched then there's the `parseDates: false` flag in the configuration to opt-out of this feature.

## Snapshotting

Server-Side Rendering is good for search engine indexing but it's also heavy on CPU not to mention the bother of setting up a Node.js server itself and keeping it running.

In many cases data on a website is "static" (doesn't change between redeployments), e.g. a personal blog or a portfolio website, so in these cases it will be beneficial (much cheaper and faster) to host a statically generated version a website on a CDN as opposed to hosting a Node.js application just for the purpose of real-time webpage rendering. In such cases one should generate a static version of the website by snapshotting it on a local machine and then host the snapshotted pages in a cloud (e.g. Amazon S3) for a very low price.

<details>
<summary>Snapshotting instructions</summary>

First run the website in production mode (for example, on `localhost`).

Then run the following Node.js script which is gonna snapshot the currently running website and put it in a folder which can then be hosted anywhere.

```sh
# If the website will be hosted on Amazon S3
npm install s3 --save
```

```js
// The following code hasn't been tested but it used to work

import path from 'path'
import { snapshot, upload, S3Uploader, copy, download } from 'react-website/static-site-generator'

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
</details>

####

The snapshotting approach works not only for classical web "documents" (a blog, a book, a portfolio, a showcase) but also for dynamic applications. Consider an online education portal where users (students) can search for online courses and the prices are different for each user (student) based on their institution. Now, an online course description itself is static (must be indexed by Google) and the actual course price is dynamic (must not be indexed by Google).

<details>
<summary>The solution is to add two <code>@preload()</code>s for the course page: one for static data (which runs while snapshotting) and another for dynamic data (which runs only in a user's web browser).

```js
import React, { Component } from 'react'
import { preload } from 'react-website'

@preload(async ({ dispatch }) => await dispatch(loadCourseInfo()))
@preload(async ({ dispatch }) => await dispatch(loadCoursePrice()), { client: true })
export default class Course extends Component {
  ...
}
```

In this example `loadCourseInfo()` will be executed while snapshotting and therefore course info will be present on the snapshotted page. But course price won't be present on the snapshotted page because it's being loaded inside `@preloadClient()` which only gets called in a user's web browser. When a user opens the course page in his web browser it will show the snapshotted page with course info with a "loading" spinner on top of it as it is loading the course price. After the course price has been loaded the "loading" spinner disappears and the user sees the fully rendered course page.
</summary>

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

### Setting <title/> and <meta/> tags

Use `@meta(state => ...)` decorator for adding `<title/>` and `<meta/>` tags:

```js
import { meta } from 'react-website'

@meta(({ state, location, parameters }) => ({
  // `<meta property="og:site_name" .../>`
  site_name: 'International Bodybuilders Club',

  // Webpage `<title/>` will be replaced with this one
  // and also `<meta property="og:title" .../>` will be added.
  title: `${state.user.name}`,

  // `<meta property="og:description" .../>`
  description: 'Muscles',
  
  // `<meta property="og:image" .../>`
  image: 'https://cdn.google.com/logo.png',
  
  // `<meta property="og:audio" .../>`
  audio: '...',
  
  // `<meta property="og:video" .../>`
  video: '...',

  // `<meta property="og:locale" .../>`
  locale: location.query.language || 'ru_RU',

  // `<meta name="og:locale:alternate" content="en_US"/>`
  // `<meta name="og:locale:alternate" content="fr_FR"/>`
  locale_other: ['en_US', 'fr_FR'],
  
  // `<meta property="og:url" .../>`
  url: 'https://google.com/',
  
  // `<meta property="og:type" .../>`
  type: 'profile',

  // `<meta charset="utf-8"/>` tag is added automatically.
  // The default "utf-8" encoding can be changed
  // by passing custom `charset` parameter.
  charset: 'utf-16',
  
  // `<meta name="viewport" content="width=device-width,
  //   initial-scale=1.0, user-scalable=no"/>`
  // tag is added automatically
  // (prevents downscaling on mobile devices).
  // This default behaviour can be changed
  // by passing custom `viewport` parameter.
  viewport: '...',

  // All other properties will be transformed directly to 
  // either `<meta property="{property_name}" content="{property_value}/>`
  // or `<meta name="{property_name}" content="{property_value}/>`
}))
export default class Page extends React.Component {
  ...
}
```

### Locale detection

This library performs the following locale detection steps for each webpage rendering HTTP request:

<!--  * Checks the `locale` query parameter (if it's an HTTP GET request) -->
 * Checks the `locale` cookie
 * Checks the `Accept-Language` HTTP header
 
The resulting locales array is passed as `preferredLocales` argument into `localize()` function parameter of the webpage rendering server which then should return `{ locale, messages }` object in order for `locale` and `messages` to be available as part of the `props` passed to the `container` component which can then pass those to `<IntlProvider/>` in case of using [`react-intl`](https://github.com/yahoo/react-intl) for internationalization.

```js
import React, { Component } from 'react'
import { Provider }         from 'react-redux'
import { IntlProvider }     from 'react-intl'
import { AppContainer }     from 'react-hot-loader'

export default function Container(props) {
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
import { goto, redirect } from 'react-website'
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
import { pushLocation, replaceLocation } from 'react-website'
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

## Monitoring

For each page being rendered stats are reported if `stats()` parameter is passed as part of the rendering service settings.

```js
{
  ...

  stats({ url, route, time: { initialize, preload, total } }) {
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
 * `time.total` — total time spent preloading and rendering the page

Rendering a complex React page (having more than 1000 components) takes about 30ms (as of 2017).

<details>
<summary>One could also set up overall Server Side Rendering performance monitoring using, for example, <a href="http://docs.datadoghq.com/guides/dogstatsd/">StatsD</a></summary>

```js
{
  ...

  stats({ url, route, time: { initialize, preload, total } }) {
    statsd.increment('count')

    statsd.timing('initialize', initialize)
    statsd.timing('@preload()', preload)
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
</details>

## Webpack HMR

Webpack's [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) (aka Hot Reload) works for React components and Redux reducers and Redux action creators (it just doesn't work for page `@preload()`s).

HMR setup for Redux reducers is as simple as adding `store.hotReload()` (as shown below). For enabling [HMR on React Components](https://webpack.js.org/guides/hmr-react/) (and Redux action creators) I would suggest the new [react-hot-loader 3](https://github.com/gaearon/react-hot-loader) (which is still in beta, so install it like `npm install react-hot-loader@3.0.0-beta.6 --save`):

#### application.js

```js
import { render } from 'react-website'
import settings from './react-website'

render(settings).then(({ store, rerender }) => {
  if (module.hot) {
    module.hot.accept('./react-website', () => {
      rerender()
      // Update reducer
      store.hotReload(settings.reducer)
    })
  }
})
```

<!--
// Update reducer (for Webpack 1)
// store.hotReload(require('./react-website').reducer)
-->

#### Container.js

```js
import React from 'react'
import { Provider } from 'react-redux'
// `react-hot-loader@3`'s `<AppContainer/>`
import { AppContainer } from 'react-hot-loader'

export default function Container({ store, children }) {
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
    ["env", { modules: false }],
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
      'webpack-hot-middleware/client?path=http://localhost:8080/__webpack_hmr',
      'babel-polyfill',
      // This line is required for `react-hot-loader@3`
      'react-hot-loader/patch',
      './src/index.js'
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    ...
  ],
  ...
}
```

P.S.: Currently it says `Warning: [react-router] You cannot change <Router routes>; it will be ignored` in the browser console. I'm just ignoring this for now, maybe I'll find a proper fix later.

<details>
<summary>Currently I'm using this hacky workaround in <code>./src/index.js</code></summary>

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
</details>

## WebSocket

`websocket()` helper sets up a WebSocket connection. 

```js
import { render, websocket } from 'react-website'

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

<details>
<summary>How to use WebSocket</summary>

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
</details>

## Server-Side Rendering and bundlers

If the application is being built with a bundler (most likely Webpack) and Server-Side Rendering is enabled then make sure to build the server-side code with the bundler too so that `require()` calls for assets (images, styles, fonts, etc) inside React components don't break (see [universal-webpack](https://github.com/catamphetamine/universal-webpack), for example).

## Advanced

At some point in time this README became huge so I extracted some less relevant parts of it into [README-ADVANCED](https://github.com/catamphetamine/react-website/blob/master/README-ADVANCED.md) (including the list of all possible settings and options). If you're a first timer then just skip that one - you don't need it for sure.

## License

[MIT](LICENSE)