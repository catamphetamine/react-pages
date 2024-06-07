# react-pages

[![npm version](https://img.shields.io/npm/v/react-pages.svg?style=flat-square)](https://www.npmjs.com/package/react-pages)
[![npm downloads](https://img.shields.io/npm/dm/react-isomorphic-render.svg?style=flat-square)](https://www.npmjs.com/package/react-pages)

A complete solution for building a React/Redux application

* Routing
* [Loading pages](#loading-pages)
* (optional) [Code splitting](#code-splitting)
* (optional) [Server-side rendering](#adding-server-side-rendering)
* [Fetching data](#fetching-data)
* [Easier Redux](#redux-module)
* [Document metadata](#setting-title-and-meta-tags) (`<title/>`, `<meta/>`, social network sharing)
* [Webpack "hot reload"](#webpack-hmr)
* [HTTP Cookies](#http-cookies)
* etc

<!--
### `react-pages` vs `react-website`

Previously this library has been known as [`react-website`](https://github.com/catamphetamine/react-website/tree/3.x) but then I found a better (in my opinion) name for it and it's now called `react-pages`. For migrating from `react-website` to `react-pages` see the [migration guide](https://gitlab.com/catamphetamine/react-pages/blob/master/MIGRATION.md).
-->

# Introduction

## Getting started

### First, install Redux.

```bash
$ yarn add redux react-redux
```

or:

```bash
$ npm install redux react-redux --save
```

Then, install `react-pages`:

```bash
$ yarn add react-pages
```

or:

```bash
$ npm install react-pages --save
```

### Then, create a `react-pages` configuration file.

The configuration file:

#### ./src/react-pages.js

```javascript
import routes from './routes.js'

export default {
  routes
}
```

The `routes`:

#### ./src/routes.js

```js
import App from '../pages/App.js'
import Item from '../pages/Item.js'
import Items from '../pages/Items.js'

export default [{
  Component: App,
  path: '/',
  children: [
    { Component: App },
    { Component: Items, path: 'items' },
    { Component: Item, path: 'items/:id' }
  ]
}]
```

The page components:

#### ./src/pages/App.js

```js
import React from 'react'
import { Link } from 'react-pages'

export default ({ children }) => (
  <section>
    <header>
      Web Application
    </header>
    {children}
    <footer>
      Copyright
    </footer>
  </section>
)
```

#### ./src/pages/Items.js

```js
import React from 'react'

export default () => <div> This is the list of items </div>
```

#### ./src/pages/Item.js

```js
import React from 'react'

export default ({ params }) => <div> Item #{params.id} </div>
```

### Finally, call `render()` in the main client-side javascript file of the app.

The main client-side javascript file of the app:

#### ./src/index.js

```javascript
import { render } from 'react-pages/client'
import settings from './react-pages.js'

// Render the page in a web browser.
render(settings)
```

The `index.html` file of the app usually looks like this:

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

### And make sure that the output files are accessible from a web browser.

The `index.html` and `bundle.js` files must be served over HTTP(S).

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

Or see the [Webpack example project](https://gitlab.com/catamphetamine/webpack-react-redux-isomorphic-render-example).

If you're using [Parcel](https://parceljs.org/) instead of Webpack then see the [basic example project](https://gitlab.com/catamphetamine/react-pages-basic-example) for the setup required in order to generate and serve `index.html` and `bundle.js` files over HTTP on `localhost:1234`.

### Done

So now the website should be fully working.

The website (`index.html`, `bundle.js`, CSS stylesheets and images, etc) can now be deployed as-is in a cloud (e.g. on Amazon S3) and served statically for a very low price. The API can be hosted "serverlessly" in a cloud (e.g. Amazon Lambda) which is also considered cheap. No running Node.js server is required.

Yes, it's not a Server-Side Rendered approach because a user is given a blank page first, then `bundle.js` script is loaded by the web browser, then `bundle.js` script is executed fetching some data from the API via an HTTP request, and only when that HTTP request comes back — only then the page is rendered (in the browser). Google won't index such websites, but if searchability is not a requirement (at all or yet) then that would be the way to go (e.g. startup "MVP"s or "internal applications"). Server-Side Rendering can be easily added to such setup should the need arise.

<details>
<summary>Adding Server Side Rendering</summary>

#####

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

Adding server-side rendering to the setup is quite simple, although I'd consider it an "advanced" topic.

While client-side rendering could be done entirely in a web browser, server-side rendering would require running a Node.js process somewhere in a cloud which slightly increases the complexity of the whole setup.

So in case of server-side rendering, `index.html` file is being generated on-the-fly by a page rendering server (a Node.js process) for each incoming HTTP request, so the `index.html` file that was used previously for client-side rendering may be deleted now as it's of no longer use.

A Node.js script for running a "rendering server" process would look like this:

#### ./rendering-server.js

```javascript
import webpageServer from 'react-pages/server'
import settings from './react-pages'

// Create webpage rendering server
const server = webpageServer(settings, {
  // Pass `secure: true` flag to listen on `https://` rather than `http://`.
  // secure: true,

  // These are the URLs of the "static" javascript and CSS files
  // which are injected into the resulting HTML webpage in the form of
  // <script src="..."/> and <link rel="style" href="..."/> tags.
  //
  // The javascript file should be the javascript "bundle" of the website
  // and the CSS file should be the CSS "bundle" of the website.
  //
  // P.S.: To inject other types of javascript or CSS files
  // (for example, files of 3rd-party libraries),
  // use a separate configuration parameter called `html`:
  // https://gitlab.com/catamphetamine/react-pages/blob/master/README-ADVANCED.md#all-webpage-rendering-server-options)
  //
  assets() {
    return {
      // This should be the URL for the application's javascript bundle.
      // In this case, the configuration assumes that the website is being run
      // on `localhost` domain with "static file hosting" enabled for its files.
      javascript: 'http://localhost:8080/bundle.js',

      // (optional)
      // This should be the URL for the application's CSS bundle.
      style: 'http://localhost:8080/bundle.css'
    }
  }
})

// Start webpage rendering server on port 3000.
// Syntax: `server.listen(port, [host], [callback])`.
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
</details>

### Conclusion

This concludes the introductory part of the README and the rest is the description of the various tools and techniques which come prepackaged with this library.

A working example illustrating Server-Side Rendering and all other things can be found here: [webpack-react-redux-isomorphic-render-example](https://gitlab.com/catamphetamine/webpack-react-redux-isomorphic-render-example).

Another minimalistic example using Parcel instead of Webpack can be found here: [react-pages-basic-example](https://gitlab.com/catamphetamine/react-pages-basic-example).

# Documentation

## Root component

`react-pages` configuration file supports a `rootComponent` parameter. It should be the root component of the application. It receives properties: `children` and `store` (Redux store).

The default (and minimal) `rootComponent` is simply a Redux `Provider` wrapped around the `children`. The Redux `Provider` enables Redux, because this library uses Redux internally.

```js
import { Provider as ReduxProvider } from 'react-redux'

export default function DefaultRootComponent({ store, children }) {
  return (
    <ReduxProvider store={store}>
      {children}
    </ReduxProvider>
  )
}
```

## Redux

If you plan on using Redux in your application, provide a `reducers` object in the `react-pages` configuration file.

#### ./src/react-pages.js

```javascript
import routes from './routes.js'

// The `reducers` parameter should be an object containing
// Redux reducers that will be combined into a single Redux reducer
// using the standard `combineReducers()` function of Redux.
import * as reducers from './redux/index.js'

export default {
  routes,
  reducers
}
```

Where the `reducers` object should be:

#### ./src/redux/index.js

```js
// For those who're unfamiliar with Redux concepts,
// a "reducer" is a function `(state, action) => state`.
//
// The main (or "root") "reducer" usually consists of "sub-reducers",
// in which case it's an object rather than a function,
// and each property of such object is a "sub-reducer" function.
//
// There's no official name for "sub-reducer".
// For example, Redux Toolkit [calls](https://redux.js.org/usage/structuring-reducers/splitting-reducer-logic) them "slices".
//
export { default as subReducer1 } from './subReducer1.js'
export { default as subReducer2 } from './subReducer2.js'
...
```

### Middleware

To add custom Redux "middleware", specify a `reduxMiddleware` parameter in the `react-pages` configuration file.

```js
export default {
  ...,

  // `reduxMiddleware` should be an array of custom Redux middlewares.
  reduxMiddleware: [
    middleware1,
    middleware2
  ]
}
```

<!--
### On Store Created (client-side)

On client side, to access Redux `store` right after it has been created, pass `onStoreCreated(store)` function option to the client-side `render()` function.
-->

<!--
<details>
<summary>Unlikely scenario: Passing a custom Redux <code>store</code></summary>

#####

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
    // Catches all HTTP errors that weren't thrown from `load()` functions.
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
  // Catches all errors thrown from page `load()` functions.
  onLoadError(error, utilities) {}
})

// Start the rendering framework.
render({
  // Redux `store`.
  store,

  // (optional)
  // Website `<Container/>` component.
  // Must wrap `children` in a `react-redux` `<Provider/>`.
  rootComponent: Container
})
```
</details>
-->

## Loading pages

To "load" a page before it's rendered (both on server side and on client side), define a static `load` property function on the page component.

<!--
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
-->

The `load` function receives a "utility" object as its only argument:

```javascript
function Page({ data }) {
  return (
    <div>
      {data}
    </div>
  )
}

Page.load = async (utility) => {
  const {
    // Can `dispatch()` Redux actions.
    dispatch,

    // Can be used to get a slice of Redux state.
    useSelector,

    // (optional)
    //
    // "Load Context" could hold any custom developer-defined variables
    // that could then be accessed inside `.load()` functions.
    //
    // To define a "load context":
    //
    // * Pass `getLoadContext()` function as an option to the client-side `render()` function.
    //   The options are the second argument of that function.
    //   The result of the function will be passed to each `load()` function as `context` parameter.
    //   The result of the function will be reused within the scope of a given web browser tab,
    //   i.e. `getLoadContext()` function will only be called once for a given web browser tab.
    //
    // * (if also using server-side rendering)
    //   Pass `getLoadContext()` function as an option to the server-side `webpageServer()` function.
    //   The options are the second argument of that function.
    //   The result of the function will be passed to each `load()` function as `context` parameter.
    //   The result of the function will be reused within the scope of a given HTTP request,
    //   i.e. `getLoadContext()` function will only be called once for a given HTTP request.
    //
    // `getLoadContext()` function recevies an argument object: `{ dispatch }`.
    // `getLoadContext()` function should return a "load context" object.
    //
    // Miscellaneous: `context` parameter will also be passed to `onPageRendered()`/`onBeforeNavigate()` functions.
    //
    context,

    // (optional)
    // A `context` parameter could be passed to the functions
    // returned from `useNavigation()` hooks. When passed, that parameter
    // will be available inside the `.load()` function of the page as `navigationContext` parameter.
    navigationContext,

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
  // For example, it could just be using the standard `fetch()` function.
  const data = await fetch(`https://data-source.com/data/${params.id}`)

  // Optionally return an object containing page component `props`.
  // If returned, these props will be available in the page component,
  // same way it works in Next.js in its `getServerSideProps()` function.
  return {
    // `data` prop will be available in the page component.
    props: {
      data
    }
  }
}
```

<!--
// Send HTTP request and wait for response.
const data = await dispatch(fetchPageData(params.id))

// Optionally return an object with `props` property.
// If returned, the `props` will be available in the page component.
return {
  props: {
    data: data
  }
}
-->

The `load` property function could additionally be defined on the application's root React component. In that case, the application would first execute the `load` function of the application's root React component, and then, after it finishes, it would proceed to executing the page component's `load` function. This behavior allows the root React component's `load` function to perform the "initialization" of the application: for example, it could authenticate the user.

<details>
<summary>Catching errors in <code>load</code> function</summary>

#####

To catch all errors originating in `load()` functions, specify an `onLoadError()` parameter in `react-pages.js` settings file.

```js
{
  onLoadError: (error, { url, location, redirect, useSelector, server }) => {
    redirect(`/error?url=${encodeURIComponent(url)}&error=${error.status}`)
  }
}
```
</details>

#####

<details>
<summary>Redirecting from <code>load</code> function</summary>

#####

To redirect from a `load` function, return an object with `redirect` property, similar to how it works in Next.js in its `getServerSideProps()` function.

```js
UserPage.load = async ({ params }) => {
  const user = await fetch(`/api/users/${params.id}`)
  if (user.wasDeleted) {
    return {
      redirect: {
        url: '/not-found'
      }
    }
  }
  return {
    props: {
      user
    }
  }
}
```
</details>

#####

<details>
<summary>Permanent redirects in routes configuration</summary>

#####

To [permanently](https://www.domain.com/blog/what-is-a-redirect/) redirect from one URL to another URL, specify a `permanentRedirectTo` parameter on the "from" route.

```js
{
  path: '/old-path/:id',
  permanentRedirectTo: '/new-path/:id'
}
```
</details>

#####

<details>
<summary>Advanced topic: client-side page <code>load</code> indication (during navigation).</summary>

#####

While the application is performing a `load` as a result of navigating to another page, a developer might prefer to show some kind of a loading indicator. Such loading indicator could be implemented as a React component that listens to the `boolean` value returned from `useLoading()` hook.

```js
import { useLoading } from 'react-pages'
import LoadingIndicator from './LoadingIndicator.js'

export default function PageLoading() {
  const isLoading = useLoading()
  return (
    <LoadingIndicator show={isLoading}/>
  )
}
```

```js
export default function App({ children }) {
  return (
    <div>
      <PageLoading/>
      {children}
    </div>
  )
}
```
</details>

#####

<details>
<summary>Advanced topic: client-side page <code>load</code> indication (initial).</summary>

#####

Initial client-side (non-server-side) `load` is different from client-side `load` during navigation: during the initial client-side `load`, the `<App/>` element is not rendered yet. Therefore, while the application is performing an initial client-side `load`, a blank screen is shown.

There're two possible workarounds for that:

* Perform the initial load on server side (not on client side).
* Show some kind of a loading indicator instead of a blank screen during the initial load.

To show a loading indicator instead of a blank screen during the initial load, one could specify some additional `react-pages` configuration parameters:

* `InitialLoadComponent` — A React component that shows an initial page loading indicator. Receives properties:
  * `initial: true` — This is just a flag that is always `true`.
  * `show: boolean` — Is `true` when the component should be shown. Is `false` when the component should no longer be shown.
    * When `false` is passed, the component could either hide itself immediately or show some kind of a hiding animation (for example, fade out). The duration of such hiding animation should be passed as `initialLoadHideAnimationDuration: number` parameter (see below) so that the library knows when can it unmount the `InitialLoadComponent`.
  * `hideAnimationDuration: number` — This is just a copy of `initialLoadHideAnimationDuration: number` parameter (see below) for convenience.

* `initialLoadShowDelay: number` — When supplying `InitialLoadComponent`, one should also specify the delay before showing the `InitialLoadComponent`. For example, such delay could be used to only show `InitialLoadComponent` for initial loads that aren't fast enough. For "no delay", the value should be `0`.

* `initialLoadHideAnimationDuration: number` — When supplying `InitialLoadComponent`, one should also specify the duration of the hide animation of `InitialLoadComponent`, if it has a hide animation. If there's no hide animation, the value should be `0`.
</details>

#####

<!--
<details>
<summary>Advanced topic: The static <code>load</code> property can also be an object having the <code>load()</code> function itself along with some options. It can also be an array of several <code>load</code>s.</summary>

#####

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

#####
-->

On client side, in order for `load` to work, all links **must** be created using the `<Link/>` component imported from `react-pages` package. Upon a click on a `<Link/>`, first it waits for the next page to load, and then, when the next page is fully loaded, the navigation itself takes place.

<details>
<summary><code>load</code> also works for Back/Forward navigation. To disable page <code>load</code> on Back navigation, pass <code>instantBack</code> property to a <code>&lt;Link/&gt;</code>.</summary>

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

There's also `instantBack: true` option that could be passed to `navigate(location, options)` function which is returned from `useNavigate()` hook. The behavior of the option is the same.

`instantBack` is ignored when navigating to the same route: for example, if there's an `<Article/>` page component having a `<Link instantBack/>` to another `<Article/>` then `instantBack` is ignored — this feature was originally added for Redux because it made sense that way (in Redux there's only one slot for data of a route that gets rewritten every time the route is navigated to). For other data fetching frameworks like Relay I guess it would make sense to turn that off. Create an issue if that's the case.

One can also use the exported `wasInstantNavigation()` function (on client side) to find out if the current page was navigated to "instantly". This can be used, for example, to restore a "state" of a widget on instant "Back" navigation so that it renders immediately with the previously cached "results" or something.

There's also a `canGoBackInstantly()` function (on client side) that tells if the currently page can be navigated "Back" from instantly. This function can be used to render a custom "Go Back" button on a page only when an instant "Back" transition could be performed.

There's also a `canGoForwardInstantly()` function (analogous to `canGoBackInstantly()`).

<!--
There's also an `isInstantBackAbleNavigation()` function (on client side) which tells if the currently ongoing navigation process is performed with `instantBack` option: for example, if `<Link instantBack/>` is clicked, or when `navigate(location, { instantBack: true })` returned from `useNavigate()` hook is called. It can be used in a `useNavigationStartEffect()` hook to save the current page state for later restoring it if the user navigates "Back" instantly.

```js
import { useBeforeNavigateToAnotherPage } from 'react-pages'

function Page() {
  useBeforeNavigateToAnotherPage(({ instantBack }) => {
    // Save the current page state.
  })
}
```
-->
</details>

<!--
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
-->

## Fetching Data

Fetching data in an application could be done using several approaches:

* Using `fetch()` for making HTTP requests and then storing the result in React Component state using `useState()` hook setter.
* Using `fetch()` for making HTTP requests and then storing the result in Redux state by `dispatch()`-ing a "setter" action.
* Using "asynchronous actions" framework provided by this library, which is described in detail in the next section of this document. This is the most sophisticated variant of the three and it comes with many useful features such as:
  * Handling cookies
  * CORS utilities
  * Authentication utilities
  * File upload progress support
  * Persisting the result in Redux state

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

<!--
There could be different approaches to how one fetches the data via HTTP.

The simplest approach would be just using the standard `fetch()` function to both load page data and submit forms. And in most cases that would be the most convenient one.

However, historically, this library came with a somehow more sophisticated way of making HTTP calls: it heavily used Redux for its operation and used the dispatching of "asynchronous" Redux actions to make HTTP requests. That was in the early days, before React "hooks" and such, and it was called the `http` utility.
-->

Because in almost all cases dispatching an "asynchronous action" in practice means "making an HTTP request", the `promise` function used in `asynchronousAction()`s always receives an `{ http }` argument: `promise: ({ http }) => ...`.

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

For that use the `http.onRequest(request, { url, originalUrl, useSelector })` setting in `./react-pages.js` where:

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
// The "main" reducer is composed of various reducers.
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
      accessToken({ useSelector, getCookie }) {
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
      accessToken({ useSelector, getCookie, url, originalUrl }) {
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
  // Catches errors thrown from page `load()` functions.
  onLoadError(error, { url, location, redirect, dispatch, useSelector, server }) {
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
      if (location.pathname !== '/error') {
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
    // Catches all HTTP errors that weren't thrown from `load()` functions.
    onError(error, { url, location, redirect, dispatch, useSelector }) {
      // JWT token expired, the user needs to relogin.
      if (error.status === 401) {
        handleUnauthenticatedError(error, url, redirect);
        // `return true` indicates that the error has been handled by the developer
        // and it shouldn't be re-thrown as an "Unhandled rejection".
        return true
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

This library doesn't force one to dispatch "asynchronous" Redux actions using the `http` utility in order to fetch data over HTTP. For example, one could use the standard `fetch()` function instead. But if one chooses to use the `http` utility, default error handlers for it could be set up.

To listen for `http` errors, one may specify two functions in `react-pages.js` configuration file:

* `onLoadError()` — Catches all errors thrown from page `load()` functions.
* `http.onError()` — Catches all HTTP errors that weren't thrown from `load()` functions. Should return `true` if the error has been handled successfully and shouldn't be printed to the console.

```js
{
  http: {
    // (optional)
    // Catches all HTTP errors that weren't thrown from `load()` functions.
    onError(error, { url, location, redirect, dispatch, useSelector }) {
      if (error.status === 401) {
        redirect('/not-authenticated')
        // `return true` indicates that the error has been handled by the developer
        // and it shouldn't be re-thrown as an "Unhandled rejection".
        return true
      } else {
        // Ignore the error.
      }
    },

    // (optional)
    // (advanced)
    //
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

By default, when using `http` utility all JSON responses get parsed for javascript `Date`s which are then automatically converted from `String`s to `Date`s.

This has been a very convenient feature that is also safe in almost all cases because such date `String`s have to be in a very specific ISO format in order to get parsed (`year-month-dayThours:minutes:seconds[timezone]`, e.g. `2017-12-22T23:03:48.912Z`).

Looking at this feature now, I wouldn't advise enabling it because it could potentially lead to a bug when it accidentally mistakes a string for a date. For example, some user could write a comment with the comment content being an ISO date string. If, when fetching that comment from the server, the application automatically finds and converts the comment text from a string to a `Date` instance, it will likely lead to a bug when the application attempts to access any string-specific methods of such `Date` instance, resulting in a possible crash of the application.

Therefore, currenly I'd advise setting `http.findAndConvertIsoDateStringsToDateInstances` flag to `false` in `react-pages.js` settings file to opt out of this feature.

```js
{
  ...
  http: {
    ...
    findAndConvertIsoDateStringsToDateInstances: false
  }
}
```

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

To add `<title/>` and `<meta/>` tags to a page, define `meta: (...) => object` static function on a page component:

```js
function Page() {
  return (
    <section>
      ...
    </section>
  )
}

Page.load = async ({ params }) => {
  return {
    props: {
      bodyBuilder: await getBodyBuilderInfo(params.id)
    }
  }
}

Page.meta = ({ props, useSelector, usePageStateSelector }) => {
  const notificationsCount = useSelector(state => state.user.notificationsCount)

  const { bodyBuilder } = props

  return {
    // `<meta property="og:site_name" .../>`
    siteName: 'International Bodybuilders Club',

    // Webpage `<title/>` will be replaced with this one
    // and also `<meta property="og:title" .../>` will be added.
    title: `(${notificationsCount}) ${bodyBuilder.name}`,

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
  }
})
```

The parameters of a `meta` function are:

* `props` — Any `props` returned from the `load()` function.
* `useSelector` — A hook that could be used to access Redux state.
* `usePageSelector` — A hook that could be used to access "page-specific" Redux state.

If the root route component also has a `meta` function, the result of the page component's `meta` function will be merged on top of the result of the root route component's `meta` function.

The `meta` will be applied on the web page and will overwrite any existing `<meta/>` tags. For example, if there were any `<meta/>` tags written by hand in `index.html` template then all of them will be dicarded when this library applies its own `meta`, so any "base" `<meta/>` tags should be moved from the `index.html` file to the root route component's `meta` function:

```js
function App({ children }) {
  return (
    <div>
      {children}
    </div>
  )
}

App.meta = ({ useSelector }) => {
  return {
    siteName: 'WebApp',
    description: 'A generic web application',
    locale: 'en_US'
  }
}
```

The `meta` function behaves like a React "hook": `<meta/>` tags will be updated if the values returned from `useSelector()` function calls do change.

<!-- There might also be "hacky" edge-cases when the application chooses to patch the `meta()` function of a component in real time for whatever reason. In those cases, a manual re-calculation and re-applying of the `meta()` is required after the patching. To do that, use the `refreshMeta()` function that is returned from the exported `useRefreshMeta()` hook. -->

In some advanced cases, the `meta()` function might need to access some state that is local to the page component and is not stored in global Redux state. That could be done by setting `metaComponentProperty` property of a page component to `true` and then rendering the `<Meta/>` component manually inside the page component, where any properties passed to the `<Meta/>` component will be available in the `props` of the `meta()` function.

```js
function Page({ Meta }) {
  const [number, setNumber] = useState(0)
  return (
    <>
      <Meta number={number}/>
      <button onClick={() => setNumber(number + 1)}>
        Increment
      </button>
    </>
  )
}

Page.metaComponentProperty = true

Page.meta = ({ props }) => {
  return {
    title: String(props.number)
  }
}
```

<!--
To update `meta` in real time, one could use the exported `updateMeta()` function. It would replace all existing `<meta/>` tags on the page. For example, to update the page's title with the count of unread notifications count:

```js
import { updateMeta } from 'react-pages'

updateMeta({
  title: unreadMessagesCount === 0
    ? 'Messages'
    : `(${unreadMessagesCount}) Messages`
})
```
-->

### Navigation Listener

If the application would like to listen to navigation changes — for example, to report the current location to Google Analytics — it might supply `onPageRendered()` function option to the client-side `render()` function:

<details>
<summary>See code example</summary>

####

```js
import { render } from 'react-pages/client'

await render(settings, {
  // Runs on the initial page load, and then after each navigation to some page.
  onPageRendered({
    // Relative URL.
    url,
    // `location` object.
    location,
    // URL pathname parameters.
    params,
    // (optional) If `getLoadContext()` function is defined,
    // this will be the result of calling that function.
    context,
    // Redux `dispatch()` function.
    dispatch,
    // Mimicks Redux `useSelector()` hook.
    useSelector
  }) {
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

`onPageRendered()` function option only gets called after the navigation has finished. It also gets called at the initial page load when the user opens the website.

If navigation start events are of interest, one may supply `onBeforeNavigate()` function option, which is basically the same as `onPageRendered()` but runs before the navigation has started.

### Get current location

Inside a `load` function: use the `location` parameter.

Anywhere in a React component: use `useLocation()` hook.

```js
import { useLocation } from 'react-pages'

const location = useLocation()
```

### Get Redux state for current location

One edge case is when an application is architectured in such a way that:

* A certain page `Component` handles a certain route.
  * For example, an `Item` page component handles `/items/:id` URLs.
* For that route, it is possible to navigate to the same route but with different route parameters.
  * For example, a user could navigate from `/items/1` to `/items/2` via a "Related items" links section.
* The page `Component` has a `.load()` function that puts data in Redux state.
  * For example, the `Item` page component first `fetch()`es item data and then puts it in Redux state via `dispatch(setItem(itemData))`.
* The page `Component` uses the loaded data from the Redux state.
  * For example, the `Item` page component gets the item data via `useSelector()` and renders it on the page.

In the above example, when a user navigates from item `A` to item `B`, there's a short timeframe of inconsistency:

* Item `A` page renders item `A` data from Redux state.
* User clicks the link to item `B`.
* Item `B` data is fetched and put into Redux state.
* Item `A` page is still rendered. `useSelector()` on it gets refreshed with the new data from Redux state and now returns item `B` data while still being on item `A` page.
* The navigation finishes and item `B` page is rendered. `useSelector()` on it returns item `B` data.

In the steps above, there's a short window of data inconsistency at the step before the last one: the page component experiences a data update from item `A` to item `B`.

If the page component doesn't account for a possibility of such change, it may lead to tricky bugs. For example, each item could have a list of reviews and the page component can be showing one review at a time. To do that, the page component introduces its own local state — a `shownReviewIndex` state variable — and then shows the review via `<Review review={item.reviews[shownReviewIndex]}/>`. In such case, when a user navigates from item `A` that has some reviews to item `B` that has no reviews, the `review` property value is gonna be `undefined` which would break the `<Review/>` component which would crash the whole page and display a blank screen to the user.

To work around such issues, any potentially unexpected updates to Redux state should be minimized inside page components. To do that, this package provides a parameter in the settings called `pageStateReducerNames: string[]` and a set of two hooks that're meant to replace the standard `useSelector()` hook for use in page components.

The standard route configuration usually has a "root" route and all other routes that branch out from it:

```js
export default [{
  path: "/",
  Component: App,
  children: [
    { path: 'not-found', Component: NotFound, status: 404 },
    { path: 'error', Component: Error, status: 500 },
    ...
  ]
}]
```

The `pageStateReducerNames` parameter is specified in the settings and it should be a list of all Redux state keys that get modified from inside page `.load()` functions:

```js
export default {
  routes,
  reducers,
  pageStateReducerNames: ['orderPage']
}
```

Those state keys become inaccessible via the standard `useSelector()` hook and should be accessed via either `usePageStateSelector()` hook or `usePageStateSelectorOutsideOfPage()` hook, depending on where in the route component chain the hook is being called.

Using the hook somewhere inside a page component (or in its children):

```js
import { usePageStateSelector } from 'react-pages'

export default function Page() {
  // const order = useSelector(state => state.orderPage.order)
  const order = usePageStateSelector('orderPage', state => state.orderPage.order)
  ...
}
```

Using the hook somewhere outside a page component:

```js
export default function Page() {
  // const order = useSelector(state => state.orderPage.order)
  const order = usePageStateSelectorOutsideOfPage('orderPage', state => state.orderPage.order)
  ...
}
```

To access "page state" properties in page `.meta()` functions, there's a parameter called `usePageStateSelector` that work analogous to the `usePageStateSelector()` exported hook.

### Get last location in the navigation chain

`useNavigationLocation` hook returns "navigation location" — the last location (so far) in the navigation chain:

* When a user starts navigating to a page, the "navigation location" set to that new page's location.
* If there's an error during said navigation, the "navigation location" is reset back to the current page's location.

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

To navigate to a different URL inside a React component, use `useNavigation()` hook.

```javascript
import { useNavigate, useRedirect } from 'react-pages'

// Usage example.
// * `navigate` navigates to a URL while adding a new entry in browsing history.
// * `redirect` does the same replacing the current entry in browsing history.
function Page() {
  const navigate = useNavigate()
  // const redirect = useRedirect()
  const onClick = (event) => {
    navigate('/items/1?color=red')
    // redirect('/somewhere')
  }
}
```

<!--
Advanced: `navigate()` also accepts `{ instantBack: true }` option.
-->

* One could also pass a `load: false` parameter in `options` when calling `navigate(location, options)` or `redirect(location, options)` to skip the `.load()` function of the target page.

* One could also pass a `navigation` parameter in `options` when calling `navigate(location, options)` or `redirect(location, options)` to pass an additional parameter called `navigationContext` to the `.load()` function of the target page.

If the current location URL needs to be updated while still staying at the same page (i.e. no navigation should take place), then instead of `redirect(location, options)` one should call `locationHistory.replace(location)`.

```javascript
import { useLocationHistory } from 'react-pages'

function Page() {
  const locationHistory = useLocationHistory()

  // * `locationHistory.push(location)`
  // * `locationHistory.replace(location)`
  // * `locationHistory.go(-1)`

  const onSearch = (searchQuery) => {
    dispatch(
      locationHistory.replace({
        pathname: '/'
        query: {
          searchQuery
        }
      })
    )
  }
  return (
    <input onChange={onSearch}/>
  )
}
```

To go "Back" or "Forward", one could use `useGoBack()` or `useGoForward()` hooks.

```javascript
import { useLocationHistory } from 'react-pages'

function Page() {
  const goBack = useGoBack()
  const goForward = useGoForward()
  return (
    <button onClick={() => goBack()}>
      Back
    </button>
  )
}
```

Both `goBack()` and `goForward()` functions accept an optional `delta` numeric argument that tells how far should it "go" in terms of the number of entries in the history. The default `delta` is `1`.

If someone prefers to interact with [`found`](https://github.com/4Catalyzer/found) `router` directly then it could be accessed at any page: either as a `router` property of a page component or via [`useRouter`](https://github.com/4Catalyzer/found#programmatic-navigation) hook.

```js
import React from 'react'
import { useRouter } from 'react-pages'

export default function Component() {
  const { match, router } = useRouter()
  ...
}
```

### Changing current location (outside of React component code)

In places where React hooks can't be used, there're `dispatch()`-able action creator alternatives to each navigation type. Those action creators are exported from this package: `import { goto } from "react-pages"`.

* `dispatch(goto())` → `useNavigate()()`
* `dispatch(redirect())` → `useRedirect()()`
* `dispatch(pushLocation())` → `useLocationHistory().push()`
* `dispatch(replaceLocation())` → `useLocationHistory().replace()`
* `dispatch(goBack())` → `useGoBack()()`
* `dispatch(goBackTwoPages())` → `2x` `useGoBack()()`
* `dispatch(goForward())` → `useGoForward()()`

### Get notified when navigation starts or ends

```js
import {
  // These hooks can only be used in "leaf" route components.
  useBeforeNavigateToAnotherPage,
  useBeforeRenderAnotherPage,
  useAfterRenderedThisPage,

  // These hooks can only be used in a "root" route component.
  useBeforeRenderNewPage,
  useAfterRenderedNewPage
} from 'react-pages'

function Page() {
  useBeforeNavigateToAnotherPage(({ location, route, params, instantBack, navigationContext }) => {
    // Navigation to another page is about to start.
    // It will start `.load()`ing another page.
    // This is an appropriate time to snapshot the current page state.
  })

  useBeforeRenderAnotherPage(({ location, route, params, instantBack, navigationContext }) => {
    // Navigation to another page is about to conclude.
    // That other page has already been `.load()`ed and is about to be rendered.
    // The current page is about to be unmounted.
  })

  useAfterRenderedThisPage(({ location, route, params, instantBack, navigationContext }) => {
    // This page is currently rendered on screen.
    // Is triggered at the initial render of the app and then after each navigation.
  })

  return (
    <section>
      <h1>
        Page Title
      </h1>
    </section>
  )
}

function Root({ children }) {
  useBeforeRenderNewPage((newPage, prevPage?) => {
    // Will render a new page on screen.
    //
    // const { location, route, params, instantBack, navigationContext } = newPage
  })

  useAfterRenderedNewPage((newPage, prevPage?) => {
    // Has rendered a new page on screen.
    // The initial render of the app also counts as "after rendered new page".
    //
    // const { location, route, params, instantBack, navigationContext } = newPage
  })

  return (
    <main>
      {children}
    </main>
  )
}
```

<!--
  import { useAfterNavigatedToAnotherPage } from 'react-pages'

  useAfterNavigatedToAnotherPage(({ location, route, params, instantBack, navigationContext }) => {
    // Navigation to another page has finished.
    // The new page has been rendered on screen.
  })
-->

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

## Hot Reload

### React Hot Reload via Webpack HMR

Webpack's [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) (aka Hot Reload) provides the ability to "hot reload" React components.

To enable hot reload for React components, one could use a combination of [`react-refresh/babel`](https://www.npmjs.com/package/react-refresh) Babel plugn and [`react-refresh-webpack-plugin`](https://www.npmjs.com/package/@pmmmwh/react-refresh-webpack-plugin) Webpack plugin.

```
npm install @pmmmwh/react-refresh-webpack-plugin react-refresh --save-dev
```

#### .babelrc

```js
{
  "presets": [
    "react",
    ["env", { modules: false }]
  ],

  "plugins": [
    // React "Fast Refresh".
    "react-refresh/babel"
  ]
}
```

#### webpack.config.js

```js
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'

export default {
  mode: 'development',
  ...,
  plugins: [
    new ReactRefreshWebpackPlugin(),
    ...
  ]
}
```

Then start [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server).

```
webpack serve --hot --module-strict-export-presence --stats-errors --stats-error-details true --config path-to-webpack.config.js"
```

P.S.: Hot reload won't work for page component's `load`/`meta` functions, so when a `load`/`meta` function code is updated, the page has to be refreshed in order to observe the changes.

### Redux Hot Reload via Webpack HMR

Webpack's [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) (aka Hot Reload) provides the ability to "hot reload" Redux reducers and Redux action creators.

<!-- Redux action creators will be updated automatically as part of the "hot reload" process for the React components that import those action creators. -->

Enabling "hot reload" for Redux reducers and Redux action creators is slightly more complex and requires some additional "hacky" code. The following line:

```js
import * as reducers from './redux/reducers.js'
```

Should be replaced with:

```js
import * as reducers from './redux/reducers.with-hot-reload.js'
```

And a new file called `reducers.with-hot-reload.js` should be created:

```js
import { updateReducers } from 'react-pages'

import * as reducers from './reducers.js'

export * from './reducers.js'

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(['./reducers.js'], () => {
    updateReducers(reducers)
  })
}
```

And then add some additional code in the file that calls the client-side `render()` function:

```js
import { render } from 'react-pages/client'

import settings from './react-pages.js'

export default async function() {
  const { enableHotReload } = await render(settings)

  if (import.meta.webpackHot) {
    enableHotReload()
  }
}
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

## Get cookies and HTTP headers on server side

When server-side rendering is enabled, one can pass a `getInitialState()` function as an option to the server-side rendering function.

That function should return an object — the initial Redux state — based on its parameters:
* `cookies` — Cookies JSON object.
* `headers` — HTTP request headers JSON object.
* `locales` — A list of locales parsed from `Accept-Language` HTTP header and ordered by most-preferred ones first.

For example, the application could set `defaultLocale` initial state property based on the `Accept-Language` HTTP header value, or it could set `device` initial state property based on the `User-Agent` HTTP header value.

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
