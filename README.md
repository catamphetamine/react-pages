# react-pages

[![npm version](https://img.shields.io/npm/v/react-pages.svg?style=flat-square)](https://www.npmjs.com/package/react-pages)
[![npm downloads](https://img.shields.io/npm/dm/react-isomorphic-render.svg?style=flat-square)](https://www.npmjs.com/package/react-pages)

A complete solution for building a React/Redux application

* Routing
* Page loading
* (optional) Code splitting
* (optional) Server-side rendering
* Asynchronous HTTP requests
* Easy and simplified Redux (no boilerplate code)
* Document metadata (`<title/>`, `<meta/>`, social network sharing)
* Webpack "hot reload"
* HTTP Cookies
* etc

<!--
### `react-pages` vs `react-website`

Previously this library has been known as [`react-website`](https://github.com/catamphetamine/react-website/tree/3.x) but then I found a better (in my opinion) name for it and it's now called `react-pages`. For migrating from `react-website` to `react-pages` see the [migration guide](https://gitlab.com/catamphetamine/react-pages/blob/master/MIGRATION.md).
-->

# Introduction

## Getting started

First, install Redux:

```bash
$ yarn add redux react-redux
```

```bash
$ npm install redux react-redux --save
```

Then, install `react-pages`:

```bash
$ yarn add react-pages
```

```bash
$ npm install react-pages --save
```

Start by creating `react-pages` configuration file.

#### ./src/react-pages.js

```javascript
import routes from './routes.js'

// Redux reducers that will be combined into
// a single Redux reducer via `combineReducers()`.
import * as reducers from './redux/index.js'

export default {
  routes,
  reducers
}
```

The routes:

#### ./src/routes.js

```js
import React from 'react'
import { Route } from 'react-pages'

import App from '../pages/App.js'
import Home from '../pages/Home.js'
import About from '../pages/About.js'

export default (
  <Route path="/" component={ App }>
    <Route component={ Home }/>
    <Route path="about" component={ About }/>
  </Route>
)
```

<!--
export default [{
  path: '/',
  Component: App,
  children: [
    { Component: Home },
    { path: 'about', Component: About }
  ]
}]
-->

#### ./src/pages/App.js

```js
import React from 'react'
import { Link } from 'react-pages'

export default ({ children }) => (
  <div>
    <h1> Web Application </h1>
    <ul>
      <li> <Link exact to="/"> Home </Link> </li>
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

export default () => <div> Made using `react-pages` </div>
```

The reducers:

#### ./src/redux/index.js

```js
// For those who're unfamiliar with Redux,
// a reducer is a function `(state, action) => state`.
export { default as reducer1 } from './reducer1.js'
export { default as reducer2 } from './reducer2.js'
...
```

Then call `render()` in the main client-side javascript file.

#### ./src/index.js

```javascript
import { render } from 'react-pages/client'
import settings from './react-pages.js'

// Render the page in web browser
render(settings)
```

And the `index.html` would look like this:

```html
<html>
  <head>
    <title>Example</title>
    <!-- Fix encoding. -->
    <meta charset="utf-8">
    <!-- Fix document width for mobile devices. -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <script src="/bundle.js"></script>
  </body>
</html>
```

Where `bundle.js` is the `./src/index.js` file built with Webpack (or you could use any other javascript bundler).

Now, `index.html` and `bundle.js` files must be served over HTTP(S).

If you're using Webpack then add [`HtmlWebpackPlugin`](https://webpack.js.org/plugins/html-webpack-plugin/) to generate `index.html`, and run [`webpack-dev-server`](https://webpack.js.org/configuration/dev-server/) with [`historyApiFallback`](https://webpack.js.org/configuration/dev-server/#devserver-historyapifallback) to serve the generated `index.html` and `bundle.js` files over HTTP on `localhost:8080`.

<details>
<summary>See <code>HtmlWebpackPlugin</code> configuration example</summary>

#### webpack.config.js

```js
const HtmlWebpackPlugin = require('html-webpack-plugin')

const buildOutputPath = '...'
const devServerPort = 8080 // Any port number.

module.exports = {
  output: {
    path: buildOutputPath,
    publicPath: `http://localhost:${devServerPort}`,
    ...
  },
  ...,
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html' // Path to `index.html` file.
    }),
    ...
  ],
  devServer: {
    port: devServerPort,
    contentBase: buildOutputPath,
    historyApiFallback : true
  }
}
```

#### src/index.html

```html
<html>
  <head>
    <title>Example</title>
    <!-- Fix encoding. -->
    <meta charset="utf-8">
    <!-- Fix document width for mobile devices. -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <!-- HtmlWebpackPlugin will insert a <script> tag here. -->
  </body>
</html>
```

```
webpack-dev-server --hot --config webpack.config.js
```
</details>

####

See the [Webpack example project](https://github.com/catamphetamine/react-pages-webpack-example).

If you're using [Parcel](https://parceljs.org/) then it's much simpler than Webpack: see the [basic example project](https://gitlab.com/catamphetamine/react-pages-basic-example) for the setup required in order to generate and serve `index.html` and `bundle.js` files over HTTP on `localhost:1234`.

So now the website should be fully working.

The website (`index.html`, `bundle.js`, CSS stylesheets and images, etc) can now be deployed as-is in a cloud (e.g. on Amazon S3) and served statically for a very low price. The API can be hosted "serverlessly" in a cloud (e.g. Amazon Lambda) which is also considered cheap. No running Node.js server is required. Yes, it's not a Server-Side Rendered approach because a user is given a blank page first, then `bundle.js` script is loaded by the web browser, then `bundle.js` script is executed fetching some data from the API via an HTTP request, and only when that HTTP request comes back — only then the page is rendered (in the browser). Google won't index such websites, but if searchability is not a requirement (at all or yet) then that would be the way to go (e.g. startup "MVP"s or "internal applications"). Server-Side Rendering can be easily added to such setup should the need arise.

<details>
<summary>Creating and using Redux <code>store</code> independently of the rendering framework.</summary>

By default, the client-side `render()` function creates a Redux `store` under the hood. Some developers might prefer, for whatever reasons, to first create that `store` and then pass that `store` as a parameter to the aforementioned `render()` function. For example, I could imagine some application migrating from `react-pages` rendering framework to something like Next.js. But Next.js doesn't provide any Redux framework, it's just a React rendering framework. So a developer might want to keep using the Redux framework provided by `react-pages` (for example, `ReduxModule` and its `http` utility) while moving the rendering part to something like Next.js. To support such scenario, this library exports a `createStore()` function that returns a Redux `store` that could either be passed to the `render()` function or be used independently if a developer just wants the Redux part of this framework.

#####

```js
import { render, createStore } from 'react-pages/client'

import routes from './routes.js'

// Redux reducers that will be combined into
// a single Redux reducer via `combineReducers()`.
import * as reducers from './redux/index.js'

// Create a Redux `store`.
const store = createStore({
  // Page routes.
  routes,

  // A combined Redux reducer.
  reducers,

  // (optional)
  // Http Client options.
  http: {
    // (optional)
    // HTTP authentication settings.
    authentication: {
      // Returns an "access token": it will be used in
      // "Authorization: Bearer" HTTP header when making HTTP requests.
      accessToken(utilities) {}
    },

    // (optional)
    // Allows HTTP cross-domain cookies.
    useCrossDomainCookies({ getDomain, belongsToDomain, url, originalUrl }) {
      return belongsToDomain('trusted.com')
    },

    // (optional)
    // Listens to HTTP errors.
    onError(error, utilities) {},

    // (optional)
    // Transforms an HTTP `Error` to a Redux state `error` property.
    getErrorData(error) {},

    // (optional)
    // Transforms HTTP request URLs.
    // For example, could transform relative URLs to absolute URLs.
    transformUrl(url) {}
  },

  // (optional)
  // Catches errors thrown from page `load()` functions.
  onError(error, utilities) {},

  // (optional)
  // The "base" website `<meta/>` tags.
  // All pages' `<meta/>` tags are applied on top of these `<meta/>` tags.
  meta
})

// Start the rendering framework.
render({
  store,

  // (optional)
  // Website `<Container/>` component.
  // Must wrap `children` in a `react-redux` `<Provider/>`.
  container: Container
})
```
</details>

## Server Side Rendering

<!--
### Search engines

Search engine crawlers like Google bot won't wait for a page to make its asynchronous HTTP calls to an API server for data: they would simply abort all **asynchronous** javascript and index the page as is. Don't mistake it for web crawlers not being able to execute javascript — they're [perfectly fine](http://andrewhfarmer.com/react-seo/) with doing that ([watch out though](https://blog.codaxy.com/debugging-googlebot-crawl-errors-for-javascript-applications-5d9134c06ee7) for using the latest javascript language features and always use polyfills for the older browsers since web crawlers may be using those under the hood).

So the only thing preventing a dynamic website from being indexed by a crawler is asynchronous HTTP queries for data, not javascript itself. This therefore brings two solutions: one is to perform everything (routing, data fetching, rendering) on the server side and the other is to perform routing and data fetching on the server side leaving rendering to the client's web browser. Both these approaches work with web crawlers. And this is what this library provides.

While the first approach is more elegant and pure, while also delivering the fastest "time to first byte", currently it is a CPU intensive task to render a complex React page (takes about 30 milliseconds of blocking CPU single core time for complex pages having more than 1000 components, as of 2017). Therefore one may prefer the second approach: performing routing and page loading on the server side while leaving page rendering to the client. This means that the user won't see any content until the javascript bundle is downloaded (which takes some time, especially with large applications not using "code splitting"), but it also means that the server's CPU is freed from rendering React. This mode is activated by passing `renderContent: false` flag to the rendering server.

### Page loading time

Another argument in favour of Server-Side Rendering is that even if a website doesn't need search engine indexing it could still benefit from saving that additional asynchronous HTTP roundtrip from the web browser to the API server for fetching the page's data. And no matter how fast the API server is, [latency is unbeatable](https://www.igvita.com/2012/07/19/latency-the-new-web-performance-bottleneck/) being about 100ms. So, by performing routing and page loading on the server side one can speed up website loading by about 100ms.

### Adding server-side rendering

Not everyone needs server-side rendering for their apps. E.g. if search engine indexing is not a priority, or if a website is a "static" one, like a "promosite" or a "personal portfolio" (just build it with a bundler and host it as a bunch of files in a cloud).
-->
Adding server-side rendering to the setup is quite simple though requiring a Node.js process running which increases hosting costs and maintenance complexity.

In case of server-side rendering `index.html` is being generated on-the-fly by page rendering server for each incoming HTTP request, so the `index.html` file may be deleted as it's of no use now.

#### ./rendering-server.js

```javascript
import webpageServer from 'react-pages/server'
import settings from './react-pages'

// Create webpage rendering server
const server = webpageServer(settings, {
  // Pass `secure: true` for HTTPS.
  //
  // These are the URLs of the "static" javascript and CSS files
  // which are injected in the resulting Html webpage
  // as <script src="..."/> and <link rel="style" href="..."/>.
  // (this is for the main application JS and CSS bundles only,
  //  for injecting 3rd party JS and CSS use `html` settings instead:
  //  https://gitlab.com/catamphetamine/react-pages/blob/master/README-ADVANCED.md#all-webpage-rendering-server-options)
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

A working example illustrating Server-Side Rendering and all other things can be found here: [webpack-react-redux-isomorphic-render-example](https://gitlab.com/catamphetamine/webpack-react-redux-isomorphic-render-example).

A much simpler and smaller example (using Parcel instead of Webpack) can be found here: [react-pages-basic-example](https://gitlab.com/catamphetamine/react-pages-basic-example).

# Documentation

## Loading pages

To "load" a page before it's rendered (both on server side and on client side), define a static `load` property function on the page component.

```javascript
import React from 'react'
import { useSelector } from 'react-redux'

function UsersPage() {
  const users = useSelector(state => state.usersPage.users)
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}

UsersPage.load = async ({ dispatch }) => {
  // Send HTTP request and wait for response
  await dispatch(fetchUsers())
}
```

The `load` function receives a parameters object as its argument:

```javascript
Page.load = async (utility) => {
  const {
    // Can `dispatch()` Redux actions.
    dispatch,

    // Returns Redux state.
    getState,

    // Current page location (object).
    location,

    // Route URL parameters.
    // For example, for route "/users/:id" and URL "/users/barackobama",
    // `params` will be `{ id: "barackobama" }`.
    params,

    // Navigation history.
    // Each entry is an object having properties:
    // * `route: string` — Example: "/user/:userId/post/:postId".
    // * `action: string` — One of: "start", "push", "redirect", "back", "forward".
    history,

    // Is this server-side rendering?
    server,

    // (utility)
    // Returns a cookie value by name.
    getCookie
  } = utility

  // Send HTTP request and wait for response.
  await dispatch(fetchPageData(params.id))
}
```

In the example above, it loads the initial page data in Redux state.

An alternative approach to loading page data would be mimicking Next.js's `getServerSideProps()` approach: instead of putting the initial page data in Redux state, it would simply return the initial page data from the data loading function, and that data would then be accessible in the page component through its `props`.

In that case, the only differences from Next.js would be:

* Next.js requires the returned object to have shape `{ props }` while this library's `load()` function can return the `props` directly.
* Next.js supports returning `{ redirect: toUrl }` object while this library's `load()` function receives a `redirect(toUrl)` function for such purposes.

```js
import React from 'react'

function UsersPage({ users }) {
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}

UsersPage.load = async () => {
  const users = await fetch('/api/users')
  return { users }
}
```

<details>
<summary>Advanced topic: The static <code>load</code> property can also be an object having the <code>load()</code> function itself along with some options. It can also be an array of several <code>load</code>s.</summary>

```js
// A single `load` example with options.
Page.load = {
  load: async () => { ... },
  ...options
}

// Multiple `load`s example.
Page.load = [
  {
    load: async () => { ... },
    ...options
  },
  {
    load: async () => { ... },
    ...options
  },
  ...
]
```

The available `options` are:

* `blocking` — (defaults to `false`) If `true` then child route `load`s will wait for this `load` to finish in order to get called.

* `blockingSibling` — (defaults to `false`) If `true` then all further adjacent (sibling) `load`s for the same route component will wait for this `load` to finish in order to get executed.

* `client` — (defaults to `false`) If `true` then the `load` will be executed only on client side. If `false` then this `load` will be executed normally: if part of initial page "load" then on server side and if part of subsequent "load" (e.g. navigation) then on client side.

* `server` — (defaults to `false`) If `true` then the `load` will be executed only on server side. If `false` then this `load` will be executed normally: if part of initial page "load" then on server side and if part of subsequent "load" (e.g. navigation) then on client side.
</details>

On client side, in order for `load` to work all links **must** be created as the `<Link/>` component imported from `react-pages` package. Upon a click on a `<Link/>` first it waits for the next page to load, and then, when the next page is fully loaded, the navigation itself takes place.

<details>
<summary><code>load</code> also works for Back/Forward navigation. To disable page <code>load</code> on Back navigation pass <code>instantBack</code> property to a <code>&lt;Link/&gt;</code>.</summary>

####

For example, consider a search results page loading some data (could be search results themselves, could be anything else unrelated). A user navigates to this page, waits for `load` to finish and then sees a list of items. Without `instantBack` if the user clicks on an item he's taken to the item's page. Then the user clicks "Back" and is taken back to the search results page but has to wait for that `load` again. With `instantBack` though the "Back" transition occurs instantly without having to wait for that `load` again. Same goes then for the reverse "Forward" navigation from the search results page back to the item's page, but that's just a small complementary feature. The main benefit is the instantaneous "Back" navigation creating a much better UX where a user can freely explore a list of results without getting penalized for it with a waiting period on each click.

```js
import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-pages'

function SearchResultsPage() {
  const results = useSelector(state => state.searchPage.results)
  return (
    <ul>
      { results.map((item) => (
        <li>
          <Link to="/items/{item.id}" instantBack>
            {item.name}
          </Link>
        </li>
      ))) }
    </ul>
  )
}

SearchResultsPage.load = async () => await fetchSomeData()
```

There's also `instantBack: true` option available for `goto(location, options)` which has the same behavior.

`instantBack` is ignored when navigating to the same route: for example, if there's an `<Article/>` page component having a `<Link instantBack/>` to another `<Article/>` then `instantBack` is ignored — this feature was originally added for Redux because it made sense that way (in Redux there's only one slot for data of a route that gets rewritten every time the route is navigated to). For other data fetching frameworks like Relay I guess it would make sense to turn that off. Create an issue if that's the case.

One can also use the exported `wasInstantNavigation()` function (on client side) to find out if the current page was navigated to "instantly". This can be used, for example, to restore a "state" of a widget on instant "Back" navigation so that it renders immediately with the previously cached "results" or something.

There's also a `canGoBackInstantly()` function (on client side) that tells if the currently page can be navigated "Back" from instantly. This function can be used to render a custom "Go Back" button on a page only when an instant "Back" transition could be performed.

There's also a `canGoForwardInstantly()` function (analogous to `canGoBackInstantly()`).

There's also an `isInstantBackAbleNavigation()` function (on client side) which tells if the currently ongoing navigation process is performed with `instantBack` option (for example, if `<Link instantBack/>` is clicked or `goto(location, { instantBack: true })` is called). It can be used in a `useNavigationStartEffect()` hook to save the current page state for later restoring it if the user navigates "Back" instantly.

```js
import { useNavigationStartEffect, isInstantBackAbleNavigation } from 'react-pages'

function Page() {
  useNavigationStartEffect(() => {
    if (isInstantBackAbleNavigation()) {
      // Save the current page state.
    }
  })
}
```
</details>

## `load` indicator

Sometimes loading a page can take some time so one may want to (and actually should) add some kind of a "spinner" to inform the user that the application isn't frozen and that the navigation process needs some more time to finish. This can be achieved by adding the built-in `<Loading/>` component on a page:

```javascript
import { Loading } from 'react-pages'
// Using Webpack CSS loader
import 'react-pages/components/Loading.css'
import 'react-pages/components/LoadingIndicator.css'

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
Page.load = async ({ dispatch }) => {
  await dispatch(asynchronousAction())
}
```

### HTTP utility

Because in almost all cases dispatching an "asynchronous action" means "making an HTTP request", the `promise` function described above always takes an `{ http }` argument: `promise: ({ http }) => ...`.

The `http` utility has the following methods:

* `head`
* `get`
* `post`
* `put`
* `patch`
* `delete`

Each of these methods returns a `Promise` and takes three arguments:

* the `url` of the HTTP request
* `data` object (e.g. HTTP GET `query` or HTTP POST `body`)
* `options` (described further)

So, API endpoints can be queried using `http` and ES6 `async/await` syntax like so:

```js
function fetchFriends(personId, gender) {
  return {
    promise: ({ http }) => http.get(`/api/person/${personId}/friends`, { gender }),
    events: ['GET_FRIENDS_PENDING', 'GET_FRIENDS_SUCCESS', 'GET_FRIENDS_FAILURE']
  }
}
```

####

The possible `options` (the third argument of all `http` methods) are

  * `headers` — HTTP Headers JSON object.
  * `authentication` — Set to `false` to disable sending the authentication token as part of the HTTP request. Set to a String to pass it as an `Authorization: Bearer ${token}` token (no need to supply the token explicitly for every `http` method call, it is supposed to be set globally, see below).
  * `progress(percent, event)` — Use for tracking HTTP request progress (e.g. file upload).
  * `onResponseHeaders(headers)` – Use for examining HTTP response headers (e.g. [Amazon S3](http://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPUT.html#RESTObjectPUT-responses-response-headers) file upload).

<details>
<summary>To set custom HTTP headers or to change HTTP request <code>Content-Type</code></summary>

###

For that use the `http.onRequest(request, { url, originalUrl, getState })` setting in `./react-pages.js` where:

* `request` is a [`superagent`](https://visionmedia.github.io/superagent/) `request` that can be modified. For example, to set an HTTP header: `request.set(headerName, headerValue)`.
* `originalUrl` is the URL argument of the `http` utility call.
* `url` is the `originalUrl` transformed by `http.transformUrl()` settings function. If no `http.transformUrl()` is configured then `url` is the same as the `originalUrl`.
</details>

<!--
  (removed)
  * `onRequest(request)` – for capturing `superagent` request (there was [a feature request](https://github.com/catamphetamine/react-website/issues/46) to provide a way for aborting running HTTP requests via `request.abort()`)
-->

<!--
`http` utility is also available from anywhere on the client side via an exported `getHttpClient()` function (e.g. for bootstrapping).
-->

### Redux module

Once one starts writing a lot of `promise`/`http` Redux actions it becomes obvious that there's a lot of copy-pasting and verbosity involved. To reduce those tremendous amounts of copy-pasta "redux module" tool may be used which:

* Gives access to `http`.
* Autogenerates Redux action status events (`${actionName}_PENDING`, `${actionName}_SUCCESS`, `${actionName}_ERROR`).
* Automatically adds Redux reducers for the action status events.
* Automatically populates the corresponding action status properties (`${actionName}Pending`: `true`/`false`, `${actionName}Error: Error`) in Redux state.

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
import { ReduxModule } from 'react-pages'

const redux = new ReduxModule('FRIENDS')

export const fetchFriends = redux.action(
  'FETCH_FRIENDS',
  (personId, gender) => http => {
    return http.get(`/api/person/${personId}/friends`, { gender })
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

Also, when the namespace or the action name argument is omitted it is autogenerated, so this

```js
const redux = new ReduxModule('FRIENDS')
...
redux.action('FETCH_ITEM', id => http => http.get(`/items/${id}`), 'item')
```

could be written as

```js
const redux = new ReduxModule()
...
redux.action(id => http => http.get(`/items/${id}`), 'item')
```

and in this case `redux` will autogenerate the namespace and the action name, something like `REACT_WEBSITE_12345` and `REACT_WEBSITE_ACTION_12345`.

<!--
<details>
<summary>
  There's a single rare use-case though when Redux action name autogeneration doesn't work.
</summary>

####

Sometimes modules for one project are imported from another project, and both these projects have their own `node_modules` installed. For example, one project could import Redux actions from another project. Because these two projects have their own `node_modules` they import each their own `ReduxModule` and each of those `ReduxModule`s starts its autogenerated action `type` counter from `1` which means that the `type`s of Redux actions imported from one project will collide with the `type`s of Redux actions created in the other project resulting in weird behavior. To prevent such autogenerated Redux action `type` collision one should pass a unique `namespace` argument for each `ReduxModule` so that their autogenerated action `type`s don't ever collide due to being prefixed with the `namespace`. If there's an autogenerated Redux action `type` collision then the library will detect it and throw an error at startup.
</details>

####
-->

<details>
<summary>
  A more complex example: a comments section for a blog post page.
</summary>

#### redux/blogPost.js

```js
import { ReduxModule } from 'react-pages'

const redux = new ReduxModule('BLOG_POST')

// Post comment Redux "action creator"
export const postComment = redux.action(
  // 'POST_COMMENT',
  (userId, blogPostId, commentText) => async http => {
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
  // 'GET_COMMENTS',
  (blogPostId) => async http => {
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

// A developer can listen to any Redux event via
// `redux.on('EVENT_NAME', (state, action) => state)`.
//
// In this case, it listens to a "success" event of a `redux.action()`.
// There's a section in this document describing this feature in more detail:
// "Redux module can also listen for events from other redux modules via <code>redux.on()</code>"
//
redux.on('BLOG_POST', 'CUSTOM_EVENT', (state, action) => ({
  ...state,
  reduxStateProperty: action.value
}))

// This is the Redux reducer which now
// handles the asynchronous actions defined above
// (and also the `handler.on()` events).
// Export it as part of the "main" reducer.
export default redux.reducer()
```

#### redux/index.js

```js
// The "main" reducer composed of various reducers.
export { default as blogPost } from './blogPost'
...
```

The React Component would look like this

```js
import React from 'react'
import { getBlogPost, getComments, postComment } from './redux/blogPost'

export default function BlogPostPage() {
  const userId = useSelector(state => state.user.id)
  const blogPost = useSelector(state => state.blogPost.blogPost)
  const comments = useSelector(state => state.blogPost.comments)
  return (
    <div>
      <article>
        { blogPost.text }
      </article>
      <ul>
        { comments.map(comment => <li>{comment}</li>) }
      </ul>
      <button onClick={() => postComment(userId, blogPost.id, 'text')}>
        Post comment
      </button>
    </div>
  )
}

// Load blog post and comments before showing the page
// (see "Page loading" section of this document)
BlogPostPage.load = async ({ dispatch, params }) => {
  // `params` are the URL parameters in route `path`.
  // For example, "/blog/:blogPostId".
  await dispatch(getBlogPost(params.blogPostId))
  await dispatch(getComments(params.blogPostId))
}
```
</details>

####

<details>
<summary>Redux module can also handle the conventional "synchronous" actions via <code>export const action = redux.simpleAction()</code></summary>

####

A simple Redux action that simply updates Redux state.

```js
action = redux.simpleAction((state, actionArgument) => newState)
```

```js
import { ReduxModule } from 'react-pages'

const redux = new ReduxModule('NOTIFICATIONS')

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
export const notify = redux.simpleAction(
  // (optional) Redux event name.
  'NOTIFY',
  // The Redux reducer:
  (state, message) => ({ ...state, message }),
  // The Redux reducer above could be also defined as:
  // 'message'
)

// This is the Redux reducer which now
// handles the actions defined above.
export default redux.reducer()
```

```js
dispatch(notify('Test'))
```
</details>

####

<details>
<summary>Redux module can also listen for events from other redux modules via <code>redux.on()</code></summary>

####

```js
// A developer can listen to any Redux event via
// `redux.on('EVENT_NAME', (state, action) => state)`.
//
// If one string argument is passed then it will listen for
// an exact Redux `action.type`.
//
// If two string arguments are passed then the first argument should be
// a `ReduxModule` namespace (the argument to `ReduxModule()` function)
// and the second argument should be a name of an asynchronous `redux.action()`.
// In that case, it will listen only for a "success" event of that `redux.action()`.
//
// To listen for a non-"success" event of a `redux.action()`,
// specify the full Redux event name.
// Example for a "pending" event: 'BLOG_POST: CUSTOM_EVENT_PENDING'.
//
redux.on('BLOG_POST', 'CUSTOM_EVENT', (state, action) => ({
  ...state,
  reduxStateProperty: action.value
}))
```
</details>

### HTTP cookies

To enable sending and receiving cookies when making cross-domain HTTP requests, specify `http.useCrossDomainCookies()` function in `react-pages.js` configuration file. If that function returns `true`, then it has the same effect as changing `credentials: "same-origin"` to `credentials: "include"` in a [`fetch()`](https://developer.mozilla.org/ru/docs/Web/API/Fetch_API/Using_Fetch) call.

When enabling cross-domain cookies on front end, don't forget to make the relevant backend changes:

* Change `Access-Control-Allow-Origin` HTTP header from `*` to an explict comma-separated list of the allowed domain names.
* Add `Access-Control-Allow-Credentials: true` HTTP header.

```js
{
  http: {
    // Allows sending cookies to and receiving cookies from
    // "trusted.com" domain or any of its sub-domains.
    useCrossDomainCookies({ getDomain, belongsToDomain, url, originalUrl }) {
      return belongsToDomain('trusted.com')
    }
  }
}
```

### HTTP authentication

In order to send an authentication token in the form of an `Authorization: Bearer ${token}` HTTP header, specify `http.authentication.accessToken()` function in `react-pages.js` configuration file.

```js
{
  http: {
    authentication: {
      // If a token is returned from this function, it gets sent as
      // `Authorization: Bearer {token}` HTTP header.
      accessToken({ getState, getCookie }) {
        return localStorage.getItem('accessToken')
      }
    }
  }
}
```

<details>
<summary>Protecting the access token from being leaked to a 3rd party</summary>

####

```js
{
  http: {
    authentication: {
      // If a token is returned from this function, it gets sent as
      // `Authorization: Bearer {token}` HTTP header.
      accessToken({ getState, getCookie, url, originalUrl }) {
        // It's recommended to check the URL to make sure that the access token
        // is not leaked to a third party: only send it to your own servers.
        //
        // `originalUrl` is the URL argument of the `http` utility call.
        // `url` is the `originalUrl` transformed by `http.transformUrl()` settings function.
        // If no `http.transformUrl()` is configured then `url` is the same as the `originalUrl`.
        //
        if (url.indexOf('https://my.api.com/') === 0) {
          return localStorage.getItem('accessToken')
        }
      }
    }
  }
}
```
</details>

####

<details>
<summary>Authentication and authorization using access tokens</summary>

#####

The `accessToken` is initially obtained when a user signs in: the web browser sends HTTP POST request to `/sign-in` API endpoint with `{ email, password }` parameters and gets `{ userInfo, accessToken }` as a response, which is then stored in `localStorage` (or in Redux `state`, or in a `cookie`) and all subsequent HTTP requests use that `accessToken` to call the API endpoints. The `accessToken` itself is usually a [JSON Web Token](https://jwt.io/introduction/) signed on the server side and holding the list of the user's priviliges ("roles"). Hence authentication and authorization are completely covered. [Refresh tokens](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/) are also [supported](https://gitlab.com/catamphetamine/react-pages/blob/master/README-ADVANCED.md#all-react-pagesjs-settings).

This kind of an authentication and authorization scheme is self-sufficient and doesn't require "restricting" any routes: if a route's `load` uses `http` utility for querying an API endpoint then this API endpoint must check if the user is signed in and if the user has the necessary priviliges. If yes then the route is displayed. If not then the user is redirected to either a "Sign In Required" page or "Access Denied" page.

A real-world (advanced) example for handling "Unauthenticated"/"Unauthorized" errors happening in `load`s and during `http` calls:

#### ./react-pages.js

```js
{
  ...,
  onError(error, { path, url, redirect, dispatch, getState, server }) {
    // Not authenticated
    if (error.status === 401) {
      return handleUnauthenticatedError(error, url, redirect);
    }
    // Not authorized
    if (error.status === 403) {
      return redirect('/unauthorized');
    }
    // Not found
    if (error.status === 404) {
      return redirect('/not-found');
    }
    // Redirect to a generic error page in production
    if (process.env.NODE_ENV === 'production') {
      // Prevents infinite redirect to the error page
      // in case of overall page rendering bugs, etc.
      if (path !== '/error') {
        // Redirect to a generic error page
        return redirect(`/error?url=${encodeURIComponent(url)}`);
      }
    } else {
      // Report the error
      console.error('--------------------------------');
      console.error(`Error while loading "${url}"`);
      console.error('--------------------------------');
      console.error(error.stack);
    }
  },

  http: {
    onError(error, { path, url, redirect, dispatch, getState }) {
      // JWT token expired, the user needs to relogin.
      if (error.status === 401) {
        return handleUnauthenticatedError(error, url, redirect);
      }
    },
    ...
  }
}

function handleUnauthenticatedError(error, url, redirect) {
  // Prevent double redirection to `/unauthenticated`.
  // (e.g. when two parallel `Promise`s load inside `load`
  //  and both get Status 401 HTTP Response)
  if (typeof window !== 'undefined' && window.location.pathname === '/unauthenticated') {
    return;
  }
  let unauthenticatedURL = '/unauthenticated';
  let parametersDelimiter = '?';
  if (url !== '/') {
    unauthenticatedURL += `${parametersDelimiter}url=${encodeURIComponent(url)}`;
    parametersDelimiter = '&';
  }
  switch (error.message) {
    case 'TokenExpiredError':
      return redirect(`${unauthenticatedURL}${parametersDelimiter}expired=✔`);
    case 'AuthenticationError':
      return redirect(`${unauthenticatedURL}`);
    default:
      return redirect(unauthenticatedURL);
  }
}
```
</details>

### HTTP errors

To listen for HTTP request errors, one may specify an `http.onError()` function in `react-pages.js` configuration file.

```js
{
  http: {
    // (optional)
    // Listens to HTTP errors.
    // `error` argument an `Error` instance.
    onError(error, { path, url, redirect, dispatch, getState }) {
      if (error.status === 401) {
        redirect('/not-authenticated')
      } else {
        // Ignore.
      }
    },

    // (optional)
    // Creates a Redux state `error` property from an HTTP `Error` instance.
    //
    // By default, returns whatever JSON data was returned in the HTTP response,
    // if any, and adds a couple of properties to it:
    //
    // * `message: string` — `error.message`.
    // * `status: number?` — The HTTP response status. May be `undefined` if no response was received.
    //
    getErrorData(error) {
      return { ... }
    }
  }
}
```

### HTTP request URLs

<details>
<summary>When sending HTTP requests to API using the <code>http</code> utility it is recommended to set up <code>http.transformUrl(url)</code> configuration setting to make the code a bit cleaner.</summary>

#####

Before:

```js
// Actions.

export const getUser = redux.action(
  (id) => http => http.get(`https://my-api.cloud-provider.com/users/${id}`),
  'user'
)

export const updateUser = redux.action(
  (id, values) => http => http.put(`https://my-api.cloud-provider.com/users/${id}`, values)
)
```

After:

```js
// Actions.

export const getUser = redux.action(
  (id) => http => http.get(`api://users/${id}`),
  'user'
)

export const updateUser = redux.action(
  (id, values) => http => http.put(`api://users/${id}`, values)
)

// Settings.

{
  ...
  http: {
    transformUrl: url => `https://my-api.cloud-provider.com/${url.slice('api://'.length)}`
  }
}
```

On server side, user's cookies are attached to **all** relative "original" URLs so `http.transformUrl(originalUrl)` must not transform relative URLs into absolute URLs, otherwise user's cookies would be leaked to a third party.
</details>

### File upload

The `http` utility will also upload files if they're passed as part of `data` (see example below). The files passed inside `data` must have one of the following types:

* In case of a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) it will be a single file upload.
* In case of a [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList) with a single `File` inside it would be treated as a single `File`.
* In case of a `FileList` with multiple `File`s inside a multiple file upload will be performed.
* In case of an `<input type="file"/>` DOM element all its `.files` will be taken as a `FileList` parameter.

File upload progress can be metered by passing `progress` option as part of the `options` .

<details>
<summary>See example</summary>

```js
// React component.
function ItemPage() {
  const dispatch = useDispatch()

  const onFileSelected = (event) => {
    const file = event.target.files[0]

    // Could also pass just `event.target.files` as `file`
    dispatch(uploadItemPhoto(itemId, file))

    // Reset the selected file
    // so that onChange would trigger again
    // even with the same file.
    event.target.value = null
  }

  return (
    <div>
      ...
      <input type="file" onChange={onFileSelected}/>
    </div>
  )
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
npm install @auth0/s3 --save
```

```js
import path from 'path'

import {
  // Snapshots website pages.
  snapshot,
  // Uploads files.
  upload,
  // Uploads files to Amazon S3.
  S3Uploader,
  // Copies files/folders into files/folders.
  // Same as Linux `cp [from] [to]`.
  copy,
  // Downloads data from a URL into an object
  // of shape `{ status: Number, content: String }`.
  download
} from 'react-pages/static-site-generator'

import configuration from '../configuration'

// Temporary generated files path.
const generatedSitePath = path.resolve(__dirname, '../static-site')

async function run() {
  // Snapshot the website.
  await snapshot({
    // The host and port on which the website
    // is currently running in production mode.
    // E.g. `localhost` and `3000`.
    host: configuration.host,
    port: configuration.port,
    pages: await generatePageList(),
    outputPath: generatedSitePath,
    //
    // Set this flag to `true` to re-run all `load`s on page load.
    // For example, if the data used on the page can be updated
    // in-between the static site deployments.
    // reloadData: true
  })

  // Copy assets (built by Webpack).
  await copy(path.resolve(__dirname, '../build/assets'), path.resolve(generatedSitePath, 'assets'))
  await copy(path.resolve(__dirname, '../robots.txt'), path.resolve(generatedSitePath, 'robots.txt'))

  // Upload the website to an Amazon S3 bucket.
  await upload(generatedSitePath, S3Uploader({
    // Setting an `ACL` for the files being uploaded is optional.
    // Alternatively a bucket-wide policy could be set up instead:
    //
    // {
    //   "Version": "2012-10-17",
    //   "Statement": [{
    //     "Sid": "AddPerm",
    //     "Effect": "Allow",
    //     "Principal": "*",
    //     "Action": "s3:GetObject",
    //     "Resource": "arn:aws:s3:::[bucket-name]/*"
    //   }]
    // }
    //
    // If not setting a bucket-wide policy then the ACL for the
    // bucket itself should also have "List objects" set to "Yes",
    // otherwise the website would return "403 Forbidden" error.
    //
    ACL: 'public-read',
    bucket: confiugration.s3.bucket,
    accessKeyId: configuration.s3.accessKeyId,
    secretAccessKey: configuration.s3.secretAccessKey,
    region: configuration.s3.region
  }))

  console.log('Done');
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

// Get the list of all page URLs.
async function generatePageList() {
  const pages = [
    '/',
    '/about',
    // Error pages need a `status` property
    // to indicate that it shouldn't throw on such errors
    // and should proceed with snapshotting the next pages.
    { url: '/unauthenticated', status: 401 },
    { url: '/unauthorized', status: 403 },
    { url: '/not-found', status: 404 },
    { url: '/error', status: 500 }
  ]

  // (optional) Add some dynamic page URLs, like `/items/123`.

  // Query the database for the list of items.
  const { status, content } = JSON.parse(await download(`https://example.com/api/items`))

  if (status !== 200) {
    throw new Error('Couldn\'t load items')
  }

  // Add item page URLs.
  const items = JSON.parse(content)
  return pages.concat(items.map(item => `/items/${item.id}`))
}
```

The `snapshot()` function snapshots the list of `pages` to `.html` files and then the `upload()` function uploads them to the cloud (in this case to Amazon S3). The `snapshot()` function also snapshots a special `base.html` page which is an empty page that should be used as the "fallback", i.e. the cloud should respond with `base.html` file contents when the file for the requested URL is not found: in this case `base.html` will see the current URL and perform all the routing neccessary on the client side to show the correct page. If the `snapshot()` function isn't passed the list of `pages` to snapshot (e.g. if `pages` argument is `null` or `undefined`) then it will only snapshot `base.html`. The static website will work with just `base.html`, the only point of snapshotting other pages is for Google indexing.

If the website is hosted on Amazon S3 then the IAM policy should allow:

```js
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::<bucket-name>"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::<bucket-name>/*"
            ]
        }
    ]
}
```
</details>

####

The snapshotting approach works not only for classical web "documents" (a blog, a book, a portfolio, a showcase) but also for dynamic applications. Consider an online education portal where users (students) can search for online courses and the prices are different for each user (student) based on their institution. Now, an online course description itself is static (must be indexed by Google) and the actual course price is dynamic (must not be indexed by Google).

<details>
<summary>The solution is to add two <code>load</code>s for the course page: one for static data (which runs while snapshotting) and another for dynamic data (which runs only in a user's web browser).</summary>

```js
import React from 'react'

export default function CoursePage() {
  ...
}

CoursePage.load = [
  async ({ dispatch }) => await dispatch(loadCourseInfo()),
  {
    load: async ({ dispatch }) => await dispatch(loadCoursePrice()),
    client: true
  }
]
```

In this example `loadCourseInfo()` will be executed while snapshotting and therefore course info will be present on the snapshotted page. But course price won't be present on the snapshotted page because it's being loaded inside the `client: true` `load` that only gets called in a user's web browser. When a user opens the course page in his web browser it will show the snapshotted page with course info with a "loading" spinner on top of it as it is loading the course price. After the course price has been loaded the "loading" spinner disappears and the user sees the fully rendered course page.

<!--
The "client-side-only" `load`s have a catch though: for [technical reasons](https://github.com/catamphetamine/react-pages/blob/master/lib/redux/client/client.js#L15) they aren't executed when the application is first rendered in a web browser. After the initial page load, the application is first rendered without resolving "client-side-only" `load`s and only after this "first rendering pass" finishes does it resolve all "client-side-only" `load`s and re-renders itself. This limitation is inherent to how React server-side rendering works. It can be simplified for cases where `index.html` approach is used, and this workaround will probably get implemented in some future version.
-->
</details>

## Page HTTP response status code

To set a custom HTTP response status code for a specific route set the `status` property of that route.

```javascript
export default [{
  path: '/',
  Component: Application,
  children: [
    { Component: Home },
    { path: 'blog', Component: Blog },
    { path: 'about', Component: About },
    { path: '*', Component: PageNotFound, status: 404 }
  ]
}]
```

### Setting `<title/>` and `<meta/>` tags

Set `meta: (state) => object` static function on a page component to add `<title/>` and `<meta/>` tags to the page:

```js
function Page() {
  return (
    <section>
      ...
    </section>
  )
}

Page.meta = (state) => ({
  // `<meta property="og:site_name" .../>`
  siteName: 'International Bodybuilders Club',

  // Webpage `<title/>` will be replaced with this one
  // and also `<meta property="og:title" .../>` will be added.
  title: `${state.user.name}`,

  // `<meta property="og:description" .../>`
  description: 'Muscles',

  // `<meta property="og:image" .../>`
  // https://iamturns.com/open-graph-image-size/
  image: 'https://cdn.google.com/logo.png',

  // Objects are expanded.
  //
  // `<meta property="og:image" content="https://cdn.google.com/logo.png"/>`
  // `<meta property="og:image:width" content="100"/>`
  // `<meta property="og:image:height" content="100"/>`
  // `<meta property="og:image:type" content="image/png"/>`
  //
  image: {
    _: 'https://cdn.google.com/logo.png',
    width: 100,
    height: 100,
    type: 'image/png'
  },

  // Arrays are expanded (including arrays of objects).
  image: [{...}, {...}, ...],

  // `<meta property="og:audio" .../>`
  audio: '...',

  // `<meta property="og:video" .../>`
  video: '...',

  // `<meta property="og:locale" content="ru_RU"/>`
  locale: state.user.locale,

  // `<meta property="og:locale:alternate" content="en_US"/>`
  // `<meta property="og:locale:alternate" content="fr_FR"/>`
  locales: ['ru_RU', 'en_US', 'fr_FR'],

  // `<meta property="og:url" .../>`
  url: 'https://google.com/',

  // `<meta property="og:type" .../>`
  type: 'profile',

  // `<meta charset="utf-8"/>` tag is added automatically.
  // The default "utf-8" encoding can be changed
  // by passing custom `charset` parameter.
  charset: 'utf-16',

  // `<meta name="viewport" content="width=device-width, initial-scale=1.0"/>`
  // tag is added automatically
  // (prevents downscaling on mobile devices).
  // This default behaviour can be changed
  // by passing custom `viewport` parameter.
  viewport: '...',

  // All other properties will be transformed directly to
  // either `<meta property="{property_name}" content="{property_value}/>`
  // or `<meta name="{property_name}" content="{property_value}/>`
})
```

Setting `meta` property on a page component discards all other `<meta/>` set by any other means, e.g. if there are any `<meta/>` tags in `index.html` template then all of them will be dicarded if setting `meta` property so don't mix `meta` property with `<meta/>` tags in `index.html`.

To set default `<meta/>` (for example, `og:site_name`, `og:description`, `og:locale`) define `meta` property in `react-pages.js` settings file:

```js
{
  routes: ...,
  reducers: ...,
  meta: {
    siteName: 'WebSite',
    description: 'A generic web application',
    locale: 'en_US'
  }
}
```

To update `meta` in real time, use the exported `updateMeta()` function. For example, to update the page's title with the count of unread notifications count:

```js
import { updateMeta } from 'react-pages'

updateMeta({
  title: unreadMessagesCount === 0
    ? 'Messages'
    : `(${unreadMessagesCount}) Messages`
})
```

### Google Analytics

To report website navigation to Google Analytics supply `onNavigate()` function option to client-side `render()` function call:

<details>
<summary>See code example</summary>

####

```js
import { render } from 'react-pages/client'

await render(settings, {
  // Runs on the initial page load, and then on each navigation.
  onNavigate(url, location, { dispatch, getState }) {
    if (process.env.NODE_ENV === 'production') {
      // Set up Google Analytics via `gtag`.
      gtag('config', configuration.googleAnalytics.id, {
        // Anonymize IP for all Google Analytics events.
        // https://developers.google.com/analytics/devguides/collection/gtagjs/ip-anonymization
        // This makes Google Analytics compliant with GDPR:
        // https://www.jeffalytics.com/gdpr-ip-addresses-google-analytics/
        'anonymize_ip': true,
        // Google Analytics can get users' "Demographics" (age, sex)
        // from "3rd party" data sources if "Advertising Reporting Features"
        // are enabled in Google Analytics admin panel.
        // Such data could be considered "Personal Identifiable Information"
        // which falls under the terms of GDPR.
        // There's also "Remarketing" feature that could also
        // fall under the terms of GDPR.
        'allow_display_features': false,
        // Specifies what percentage of users should be tracked.
        // This defaults to 100 (no users are sampled out) but
        // large sites may need to use a lower sample rate
        // to stay within Google Analytics processing limits.
        // 'sample_rate': 1,
        // Report "page view" event to Google Analytics.
        // https://stackoverflow.com/questions/37655898/tracking-google-analytics-page-views-in-angular2
        // https://developers.google.com/analytics/devguides/collection/gtagjs/single-page-applications
        'page_path': location.pathname
      })
    }
  }
})
```
</details>

### Get current location

Inside a `load` function: use the `location` parameter.

Anywhere in a React component: use `useLocation()` hook.

```js
import { useLocation } from 'react-pages'

const location = useLocation()
```

### Get current route

Inside a `load` function: you already know what route it is.

Anywhere in a React component: use `useRoute()` hook.

```js
import { useRoute } from 'react-pages'

const route = useRoute()
```

A `route` has:

* `path` — Example: `"/users/:id"`
* `params` — Example: `{ id: "12345" }`
* `location` — Same as `useLocation()`

### Changing current location

Dispatch `goto`/`redirect` Redux action to change current location (both on client and server).

```javascript
import { goto, redirect } from 'react-pages'
import { useDispatch } from 'react-redux'

// Usage example.
// * `goto` navigates to a URL while adding a new entry in browsing history.
// * `redirect` does the same replacing the current entry in browsing history.
function Page() {
  const dispatch = useDispatch()
  const onClick = (event) => {
    dispatch(goto('/items/1?color=red'))
    // dispatch(redirect('/somewhere'))
  }
}
```

<!--
Advanced: `goto()` can also take `{ instantBack: true }` option.
-->

If the current location needs to be changed while still staying at the same page (e.g. a checkbox has been ticked and the corresponding URL query parameter must be added), then use `dispatch(pushLocation(location))` or `dispatch(replaceLocation(location))` Redux actions.

```javascript
import { useDispatch } from 'react-redux'
import { pushLocation, replaceLocation } from 'react-pages'

function Page() {
  const dispatch = useDispatch()
  const onSearch = (query) => {
    dispatch(
      pushLocation({
        pathname: '/'
        query: {
          query
        }
      })
    )
  }
}
```

To go "Back"

```javascript
import { useDispatch } from 'react-redux'
import { goBack, goBackTwoPages } from 'react-pages'

function Page() {
  const dispatch = useDispatch()
  return (
    <button onClick={() => dispatch(goBack())}>
      Back
    </button>
  )
}
```

Can also go "Forward" via `goForward()` in the same fashion.

If someone prefers interacting with [`found`](https://github.com/4Catalyzer/found) `router` directly instead then it is available on all pages as a `router` property, or via [`useRouter`](https://github.com/4Catalyzer/found#programmatic-navigation) hook.

```js
import React from 'react'
import { useRouter } from 'react-pages'

export default function Component() {
  const { match, router } = useRouter()
  ...
}
```

## Monitoring

For each page being rendered stats are reported if `stats()` parameter is passed as part of the rendering service settings.

```js
{
  ...

  stats({ url, route, time: { load } }) {
    if (load > 1000) { // in milliseconds
      db.query('insert into server_side_rendering_stats ...')
    }
  }
}
```

The arguments for the `stats()` function are:

 * `url` — The requested URL (without the `protocol://host:port` part)
 * `route` — The route path (e.g. `/user/:userId/post/:postId`)
 * `time.load` — The time for executing all `load`s.
 <!--
 `time.loadAndRender` — (client side only) The time for executing all `load`s. On client side `load`s not only load the page, they also perform page rendering when "success" Redux action is dispatched. So it's not just the time to load page data, it's also the time to render the data.
 -->

Rendering a complex React page (having more than 1000 components) takes about 30ms (as of 2017).

<details>
<summary>One could also set up overall Server Side Rendering performance monitoring using, for example, <a href="http://docs.datadoghq.com/guides/dogstatsd/">StatsD</a></summary>

```js
{
  ...

  stats({ url, route, time: { initialize, load, total } }) {
    statsd.increment('count')

    statsd.timing('initialize', initialize)
    statsd.timing('load', load)
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
 * `load` — page loading time
 * `time` - total time spent loading and rendering the page

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

Webpack's [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) (aka Hot Reload) works for React components and Redux reducers and Redux action creators (it just doesn't work for page `load`s).

HMR setup for Redux reducers is as simple as adding `store.hotReload()` (as shown below). For enabling [HMR on React Components](https://webpack.js.org/guides/hmr-react/) (and Redux action creators) use [react-hot-loader](https://github.com/gaearon/react-hot-loader):

#### application.js

```js
import { render } from 'react-pages/client'
import settings from './react-pages'

render(settings).then(({ store }) => {
  if (module.hot) {
    module.hot.accept('./react-pages', () => {
      // Update Redux "reducer".
      store.hotReload(settings.reducers)
    })
  }
})
```

#### Container.js

```js
import React from 'react'
import { Provider } from 'react-redux'

export function Container({ store, children }) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
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
    // React "Fast Refresh".
    "react-refresh/babel"
  ]
}
```

#### ./src/index.js

```js
// An ES6 polyfill for older browsers.
require('babel-polyfill')
...
```

Then start [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server).

```
webpack serve --hot --module-strict-export-presence --stats-errors --stats-error-details true --config path-to-webpack.config.js"
```

## WebSocket

`websocket()` helper sets up a WebSocket connection.

```js
import { render } from 'react-pages/client'
import websocket from 'react-pages/websocket'

render(settings).then(({ store }) => {
  websocket({
    host: 'localhost',
    port: 80,
    // secure: true,
    store,
    token: localStorage.getItem('token')
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

If the application is being built with a bundler (most likely Webpack) and Server-Side Rendering is enabled then make sure to build the server-side code with the bundler too so that `require()` calls for assets (images, styles, fonts, etc) inside React components don't break (see [universal-webpack](https://gitlab.com/catamphetamine/universal-webpack), for example).

## Code splitting

Code splitting is supported. See [README-CODE-SPLITTING](https://gitlab.com/catamphetamine/react-pages/blob/master/README-CODE-SPLITTING.md)

## `Accept-Language` and `User-Agent` HTTP headers

When server-side rendering is enabled `Accept-Language` and `User-Agent` HTTP headers are accessible inside `getInitialState({ cookies, headers, locales })` function which can be passed as an option to `webpageServer(settings, options)`. `locales` are parsed from the `Accept-Language` HTTP header.

## Known Issues

### Same Route Navigation

Suppose there's a "forum" web application having `<Thread/>` pages with URLs like `/thread/:id`, and one thread could link to another thread. When a user navigates to a thread and clicks a link to another thread there, a navigation transition will start: the "current" thread page will still be rendered while the "new" thread page is loading. The [issue](https://github.com/4Catalyzer/found/issues/639#issuecomment-567084189) is that both these URLs use the same Redux state subtree, so, after the "new" thread data has been loaded, but before the "new" thread page is rendered, the "current" thread page is gonna re-render with the updated Redux state subtree.

If a thread page doesn't use `useState()`, then it wouldn't be an issue. But if it does, it could result in weird bugs. For example, if a `<Thread/>` page had a `fromIndex` state variable that would control the first shown comment index, then, when the "current" page is re-rendered with the updated Redux state subtree for the "new" thread, the `fromIndex` might exceed the "new" thread's comments count resulting in an "out of bounds" exception and the page breaking.

To prevent such bugs, for all routes that could link to the same route, their page components should be rendered in a wrapper with a `key` corresponding to all URL parameters:

```js
function Thread() {
  const [fromIndex, setFromIndex] = useState(0)
  return ...
}

Thread.meta = ...
Thread.load = async ({ dispatch, params }) => {
  await dispatch(loadThreadData(params.id))
}

// This is a workaround for cases when navigating from one thread
// to another thread in order to prevent bugs when the "new" thread data
// has already been loaded and updated in Redux state but the "old" thread
// page is still being rendered.
// https://github.com/4Catalyzer/found/issues/639#issuecomment-567084189
export default function Thread_() {
  const thread = useSelector(state => state.thread.thread)
  return <Thread key={thread.id}/>
}
Thread_.meta = Thread.meta
Thread_.load = Thread.load
```

## Advanced

At some point in time this README became huge so I extracted some less relevant parts of it into [README-ADVANCED](https://gitlab.com/catamphetamine/react-pages/blob/master/README-ADVANCED.md) (including the list of all possible settings and options). If you're a first timer then just skip that one - you don't need it for sure.

## License

[MIT](LICENSE)
