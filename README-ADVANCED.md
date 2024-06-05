This section contains advanced topics. This means that the features described here are for those who have already spent some time with this library and therefore won't be overwhelmed and confused by the topics covered here.

## CSRF protection

[Cross-Site Request Forgery attacks](http://docs.spring.io/spring-security/site/docs/current/reference/html/csrf.html) are the kind of attacks when a legitimate user is tricked into navigating a malicious website which, upon loading, sends a forged HTTP request (GET, POST) to the legitimate website therefore performing an action on behalf of the legitimate user (because the "remember me" cookie is also sent along).

How can a legitimate website guard its users from such attacks? One solution is to ignore the "remember me" cookie and force reading its value from an HTTP header. Because CSRF attacks can't send custom headers (at least using bare HTML/Javascript, without exploiting Adobe Flash plugin bugs, etc), this renders such hacking attempts useless.

Therefore the API should only read "remember me" token from an HTTP header. The client-side application will read "remember me" cookie value and send it as part of an HTTP header for each HTTP request. Alternatively "remember me" token can be stored in a web browser's `localStorage`.

So, **javascript is required** on the client side in order for this CSRF attacks protection to work (because only javascript can set HTTP headers). If a developer instead prefers to run a website for javascript-disabled users (like [Tor](https://www.deepdotweb.com/)) then the only way is to authenticate users in REST API endpoints by a "remember me" cookie rather than `Authorization` HTTP header. This will open the website users to various possible javascriptless CSRF attacks.

## `onLoaded`

When using `load` static property on a page component with `{ client: true }` option it's sometimes required to perform some actions (e.g. adjust the current URL) after those `load`ers finish (and after the browser navigates to the loaded page). While with regular `load`ers it could be done using `componentDidMount()` such an approach wouldn't work for `{ client: true }` `load`ers because they're executed after `componentDidMount()`. The solution is `onLoaded` static property which is called after all `load`ers finish on client side. `onLoaded` static property won't work when `codeSplit: true` setting is configured. <!-- (could be implemented as some `onPageLoaded` route attribute) -->

```js
import { replaceLocation } from 'react-pages'

function Page() {
  return (
    <section>
      ...
    </section>
  )
}

Page.onLoaded = ({ dispatch, useSelector, location }) => {
  if (isAnIdURL(location.pathname)) {
    dispatch(replaceLocation(replaceIdWithAnAlias(location, useSelector(state => state.userProfilePage.userProfile))))
  }
}
```

## Restricted routes

In most applications some routes are only accessible by a specific group of users. One may ask what route restriction mechanisms does this library provide. The answer is: you actually don't need them. For example, in my projects the `load` function itself serves as a guard by querying a REST API endpoint which performs user authentication internally and throws a "403 Access Denied" error if a user doesn't have the permission to view the page.

<!--
## Cancelling previous action

E.g. for an autocomplete component querying backend for matches it can be useful to be able to abort the previous search for matches when the user enters additional characters. In this case `Promise` cancellation feature can be employed which requires using `bluebird` `Promise` implementation being [configured](http://bluebirdjs.com/docs/api/cancellation.html) for `Promise` cancellation and passing `cancelPrevious: true` flag in an asynchronous Redux "action".

```js
function autocompleteMatch(inputValue) {
  return {
    promise: ({ http }) => http.get(`/search?query=${inputValue}`),
    events: ['AUTOCOMPLETE_MATCH_PENDING', 'AUTOCOMPLETE_MATCH_SUCCESS', 'AUTOCOMPLETE_MATCH_ERROR'],
    cancelPrevious: true
  }
}
```

Gotcha: when relying on `bluebird` `Promise` cancellation don't use `async/await` syntax which is transpiled by Babel using [Facebook's `regenerator`](https://github.com/facebook/regenerator) (as of 2017) which doesn't use `Promise`s internally meaning that the following `async/await` rewrite won't actually cancel the previous action:

```js
// Action cancellation won't work
function autocompleteMatch(inputValue) {
  return {
    promise: async (({ http })) => await http.get(`/search?query=${inputValue}`),
    events: ['AUTOCOMPLETE_MATCH_PENDING', 'AUTOCOMPLETE_MATCH_SUCCESS', 'AUTOCOMPLETE_MATCH_ERROR'],
    cancelPrevious: true
  }
}
```
-->

## Redux module event and property naming

By default it generates `"_PENDING"`, `"_SUCCESS"` and `"_ERROR"` Redux events along with the corresponding camelCase properties in Redux state. One can customize that by supplying custom `reduxEventNaming` and `reduxPropertyNaming` functions.

#### react-pages.js

```js
import reduxSettings from './react-pages-redux'

export default {
  // All the settings as before

  ...reduxSettings
}
```

#### react-pages-redux.js

```js
import { underscoredToCamelCase } from 'react-pages'

export default {
  // When supplying `event` instead of `events`
  // as part of an asynchronous Redux action
  // this will generate `events` from `event`
  // using this function.
  reduxEventNaming: (event) => ([
    `${event}_PENDING`,
    `${event}_SUCCESS`,
    `${event}_ERROR`
  ]),

  // When using "redux module" tool
  // this function will generate a Redux state property name from an event name.
  // By default it's: event `GET_USERS_ERROR` => state.`getUsersError`.
  reduxPropertyNaming: underscoredToCamelCase
}
```

#### redux/blogPost.js

```js
import { ReduxModule, eventName } from 'react-pages'
import reduxSettings from './react-pages-redux'

const redux = new ReduxModule('BLOG_POST', reduxSettings)
...
```

Notice the extraction of these two configuration parameters (`reduxEventNaming` and `reduxPropertyNaming`) into a separate file `react-pages-redux.js`: this is done to break circular dependency on `./react-pages.js` file because the `routes` parameter inside `./react-pages.js` is the `./routes.js` file which `import`s React page components which in turn `import` action creators which in turn would import `./react-pages.js` hence the circular (recursive) dependency (same goes for the `reducers` parameter inside `./react-pages.js`).

## Locales

On client side there are a couple utility functions available for localization purposes.

`getPreferredLocales()` function returns user's "preferred locales" (taken from `locale` cookie and `Accept-Language` HTTP header) if server-side rendering is enabled.

```js
import { getPreferredLocales } from 'react-pages'

getPreferredLocales()
// E.g. ["ru", "ru-RU", "en-US", "en"]
```

When server-side rendering is disabled then use `getPreferredLocale()` function which returns the preferred locale of user's web browser (taken from `navigator.language`).

```js
import { getPreferredLocale } from 'react-pages'

getPreferredLocale()
// E.g. "ru-RU", "en".
```

To convert locale to language use `getLanguageFromLocale()` function.

```js
import { getLanguageFromLocale } from 'react-pages'

getLanguageFromLocale('ru-RU')
// Outputs: "ru".
```

## Serving assets and API

In the introductory part of the README "static" files (assets) are served by `webpack-dev-server` on `localhost:8080`. It's for local development only. For production these "static" files must be served by someone else, be it a dedicated proxy server like NginX or (recommended) a cloud-based solution like Amazon S3.

Also, a real-world website most likely has some kind of an API, which, again, could be either a dedicated API server (e.g. written in Golang), a simple Node.js application or a modern "serverless" API like [Amazon Lambda](https://aws.amazon.com/lambda) deployed using [`apex`](https://github.com/apex/apex) and hosted in the cloud.

#### The old-school way

The old-school way is to set up a "proxy server" like [NginX](https://www.sep.com/sep-blog/2014/08/20/hosting-the-node-api-in-nginx-with-a-reverse-proxy/) dispatching all incoming HTTP requests: serving "static" files, redirecting to the API server for `/api` calls, etc.

<details>
  <summary>The old-school way</summary>

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

A quick Node.js proxy server could also be made up for development purposes using [http-proxy](https://github.com/nodejitsu/node-http-proxy) library.

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
</details>

#### The modern way

The modern way is not using any "proxy servers" at all. Instead everything is distributed and decentralized. Webpack-built assets are uploaded to the cloud (e.g. Amazon S3) and webpack configuration option `.output.publicPath` is set to something like `https://s3-ap-southeast-1.amazonaws.com/my-bucket/folder-1/` (your CDN URL) so now serving "static" files is not your job – your only job is to upload them to the cloud after Webpack build finishes. API is dealt with in a similar way: CORS headers are set up to allow querying directly from a web browser by an absolute URL and the API is either hosted as a standalone API server or run "serverless"ly, say, on Amazon Lambda, and is queried by an absolute URL, like `https://at9y1jpex0.execute-api.us-east-1.amazonaws.com/master/users/list`.

## Internal `render()` function

For some advanced use cases (though most likely no one's using this) the internal `render()` function is exposed.

```js
import { render } from 'react-pages/server'
import settings from './react-pages'

// Returns a Promise.
//
// redirect - redirection URL (in case of an HTTP redirect).
// cookies - a `Set` of HTTP cookies to be set (`response.setHeader('Set-Cookie', cookie)` for each of them).
// status  - HTTP response status.
// content - rendered HTML document (a Node.js "Readable Stream").
//
const { redirect, cookies, status, content } = await render(
  {
    url: request.url,
    origin: `${request.protocol}://${request.host}`,
    headers: request.headers
  },
  settings,
  serverSideConfiguration
)
```

The `await render()` function call can be wrapped in a `try/catch` block and for the `catch` block there's also the exported `renderError(error)` function.

```js
import { renderError } from 'react-pages/server'

// status  - HTTP response status.
// content - rendered error (a string).
// contentType - HTTP `Content-Type` header (either `text/html` or `text/plain`).
//
const { status, content, contentType } = renderError(error)
```

## All `react-pages.js` settings

```javascript
{
  // Routes element.
  routes: require('./src/routes')

  // (optional)
  // Redux reducers (an object)
  reducers: require('./src/redux/index')

  // A React component.
  //
  // React page component (`children` property)
  // is rendered inside this "container" component.
  // (e.g. Redux `<Provider/>`,
  //  `react-hot-loader@3`'s `<AppContainer/>`
  //  and other "context providers")
  //
  // By default it just wraps everything with Redux `<Provider/>`:
  //
  // export default ({ store, children }) => (
  //   <Provider store={store}>
  //     {children}
  //   </Provider>
  // )
  //
  rootComponent: require('./src/Container')

  // Use this flag to enable "code splitting" mode.
  // See `README-CODE-SPLITTING` for more info.
  // https://gitlab.com/catamphetamine/react-pages/blob/master/README-CODE-SPLITTING.md
  codeSplit: true/false

  // When using `load`s in a client-side-only set up,
  // `react-pages` can show a "loading" screen on initial page load.
  //
  // Also, when using `codeSplit` with `getComponent`,
  // route components are loaded after the initial page render.
  // To hide webpage content until all route components are resolved,
  // one may show a "loading" screen.
  //
  // To activate "show initial load" feature, supply an `InitialLoadComponent`.
  //
  // Properties:
  // * initial: true
  // * show: boolean
  // * hideAnimationDuration: number
  //
  InitialLoadComponent

  // When supplying `InitialLoadComponent`, one should also specify `initialLoadShowDelay`:
  // the delay before showing the `InitialLoadComponent`.
  // This delay could be used to only show `InitialLoadComponent` for initial loads
  // that aren't fast enough.
  initialLoadShowDelay: 0

  // When supplying `InitialLoadComponent`, one should also specify `initialLoadHideAnimationDuration`:
  // the duration of the hide animation of `InitialLoadComponent`, if it has a hide animation.
  initialLoadHideAnimationDuration: 160

  // When using `react-hot-loader` one can pass `hot` as a configuration parameter
  // instead of passing a custom `rootComponent` component just for enabling `react-hot-loader`.
  // import { hot } from 'react-hot-loader'
  hot: hot

  // (optional)
  // Default `<meta/>` (applies to all pages).
  meta: { ... }

  // (optional)
  // User can add custom Redux middleware
  reduxMiddleware: [...]

  // (optional)
  // User can add custom Redux store enhancers
  reduxStoreEnhancers: [...]

  // (optional)
  // Is called for errors happening during the initial page render
  // (which means during Server-Side Rendering
  //  and the initial client-side render `load`s).
  //
  // For example, Auth0 users may listen for
  // JWT token expiration here and redirect to a login page.
  //
  // Or, if `load` throws an "Unauthorized" error
  // then a redirect to "/unauthorized" page can be made here.
  //
  // `path` is `url` without `?...` parameters.
  // `redirect()` redirects to a URL.
  //
  onLoadError: (error, { path, url, redirect, useSelector, server }) => {
    redirect(`/error?url=${encodeURIComponent(url)}&error=${error.status}`)
  }

  // (not used)
  // Gets current user's locale.
  // getLocale: (state) => state.user.profile && state.user.profile.locale || getCookie('locale') || getPreferredLocale() || 'en'

  // (optional)
  // `http` utility settings
  http:
  {
    // (optional)
    // When set to `true`, it will automatically find and convert all ISO date strings
    // to `Date` objects in HTTP responses of `application/json` type.
    //
    // This is more of a legacy feature that was historically "on" by default.
    // Looking at this feature now, I wouldn't advise enabling it because it could potentially
    // lead to a bug when it accidentally mistakes a string for a date.
    // For example, some user could write a comment with the comment content being an ISO date string.
    // If, when fetching that comment from the server, the application automatically finds and converts
    // the comment text from a string to a `Date` instance, it will likely lead to a bug
    // when the application attempts to access any string-specific methods of such `Date` instance,
    // resulting in a possible crash of the application.
    //
    findAndConvertIsoDateStringsToDateInstances: true

    // (optional)
    transformUrl: (url, { server: boolean }) => url
    // Using `http.transformUrl(url)` configuration parameter
    // one can transform shortcut URLs like `api://items/123`
    // into longer ones like `https://my-api.cloud-provider.com/items/123`.

    // (optional)
    //
    // Is called before the HTTP request is sent.
    // Developers can set custom HTTP headers here
    // or change the HTTP request `Content-Type`.
    //
    // * `request` is a `superagent` `request` that can be modified
    //   (for example, to set an HTTP header: `request.set(headerName, headerValue)`).
    // * `originalUrl` is the URL argument of the `http` utility call.
    // * `url` is the `originalUrl` transformed by `http.transformUrl()`
    //   (if no `http.transformUrl()` is configured then `url` is the same as the `originalUrl`).
    //
    onRequest: (request, { url, originalUrl, useSelector }) => {}

    // (optional)
    // Catches all HTTP errors that weren't thrown from `load()` functions.
    onError: (error, { url, location, redirect, dispatch, useSelector }) => {
      if (isSomeParticularError(error)) {
        redirect('/some-particular-error')
        // `return true` indicates that the error has been handled by the developer
        // and it shouldn't be re-thrown as an "Unhandled rejection".
        return true
      }
    }
    //
    // Is called when `http` calls either fail or return an error.
    // Is not called for errors happening during the initial page render
    // which means it can only be called as part of an HTTP call
    // triggered by some user interaction in a web browser.
    //
    // For example, Auth0 users may listen for
    // JWT token expiration here and redirect to a login page.
    //
    // `path` is `url` without `?...` parameters.
    // `redirect()` redirects to a URL.

    // (optional)
    getErrorData: (error) => ({ ... })
    //
    // Parses a `superagent` `Error` instance
    // into a plain JSON object for storing it in Redux state.
    // The reason is that `Error` instance can't be part of Redux state
    // because it's not a plain JSON object and therefore violates Redux philosophy.
    //
    // In case of an `application/json` HTTP response
    // the `error` instance has `.data` JSON object property
    // which carries the `application/json` HTTP response payload.
    //
    // By default `getErrorData` takes the `application/json` HTTP response payload
    // and complements it with HTTP response `status` and `Error` `message`.

    // (optional)
    // (experimental: didn't test this function parameter but it's likely to work)
    //
    catch: async (error, retryCount, helpers) => {}
    //
    // Can optionally retry an HTTP request in case of an error
    // (e.g. if an Auth0 access token expired and has to be refreshed).
    // https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
    //
    // If an error happens then the logic is (concept):
    //
    // httpRequest().then(..., (error) => {
    //   return catch(error, 0, helpers).then(httpRequest).then(..., (error) => {
    //     return catch(error, 1, helpers).then(httpRequest).then(..., (error) => {
    //       ...
    //     ))
    //   ))
    // ))
    //
    // Auth0 `catch` example:
    //
    // catch(error, retryCount, helpers) {
    //   if (retryCount === 0) {
    //     if (error.status === 401 && error.data && error.data.name === 'TokenExpiredError') {
    //       return requestNewAccessToken(localStorage.refreshToken)
    //     }
    //   }
    //   throw error
    // }
    //
    // The `helpers` argument object holds:
    //
    // * `getCookie(name)` – a helper function which works both on client and server.
    //   This function can be used to obtain a "refresh token" stored in a non-"httpOnly" cookie.
    //
    // * `store` – Redux store.
    //
    // * `http` – `http` utility.
  }

  // (optional)
  authentication:
  {
    // (optional)
    accessToken: ({ useSelector, path, url, getCookie }) => String
    //
    // If specified, this "access token" will always be set
    // automatically in the "Authorization" HTTP header
    // when using `http` utility inside Redux actions.
    // "Access tokens" are supposed to be short-lived
    // and their storage requirements are less strict
    // than those for the "refresh token".
    // For example, an "access token" may be stored
    // in a regular non-"httpOnly" cookie.
    // Since this method is run both on client and server
    // the provided `getCookie(name)` function works in both cases.
    //
    // `helpers` object holds:
    //
    // * `store` - Redux store

    // (optional)
    header: 'Authorization'
    // The HTTP header containing authentication token
    // (e.g. "Authorization: Bearer {token}").
    // Is "Authorization" by default.
    // (some people requested this setting for
    //  some projects using 'X-Authorization' header
    //  due to the 'Authorization' header being blocked)
  }

  // (optional)
  //
  // If some "base path" should be prepended to all URLs,
  // set it as a `basename` parameter.
  //
  // It can be used, for example, for hosting a website on GitHub pages
  // where each website has a prefix.
  // For example, for website `username.github.io/repo`, the `basename` would be `/repo`.
  //
  // A `basename` should not include a trailing slash.
  //
  basename: '/path'

  // (optional)
  // When supplying `event` instead of `events`
  // as part of an asynchronous Redux action
  // this will generate `events` from `event`
  // using this function.
  reduxEventNaming: (event) => ([
    `${event}_PENDING`,
    `${event}_SUCCESS`,
    `${event}_ERROR`
  ])

  // (optional)
  // When using "redux module" tool
  // this function will generate a Redux state property name for an event name.
  // E.g. event `GET_USERS_ERROR` => state.`getUsersError`.
  reduxPropertyNaming(event) {
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
  // Specify `secure: true` flag to use `https` protocol instead of `http`.
  // secure: true

  // This setting is for people using a proxy server
  // to query their API by relative URLs
  // using the `http` utility in Redux "action creators".
  // The purpose of this setting is to prepend `host` and `port`
  // to such relative API URLs on the server side when using the `http` utility.
  // Specify `secure: true` flag to use `https` protocol instead of `http`.
  // Note that using a proxy server is considered kinda outdated.
  proxy:
  {
    host: '192.168.0.1',
    port: 3000,
    // secure: true
  }

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
  //
  // The `assets` parameter provides URLs of javascript and CSS files
  // which will be inserted into the <head/> element of the resulting Html webpage
  // (as <script src="..."/> and <link rel="style" href="..."/>)
  //
  // Also a website "favicon" URL, if any.
  //
  // Can be an `object` or a `function` returning an `object`.
  //
  // `javascript` and `styles` can be `string`s or `object`s.
  // If they are objects then one should also provide an `entry` parameter.
  // If "common" entry is configured in Webpack
  // then it's always included on every page.
  //
  assets: (path, { store }) =>
  {
    return {
      // Webpack "entry points" to be included
      // on a page for this URL `path`.
      // Defaults to `["main"]`:
      // If no "entry points" are configured in Webpack configuration
      // then Webpack creates a single "main" entry point.
      // entries: [...],

      // Javascripts for the `entries`.
      javascript: {
        main: '/assets/main.js'
      },

      // (optional)
      // Styles for the `entries`.
      styles: {
        main: '/assets/main.css'
      },

      // (optional)
      // Website "favicon" URL.
      icon: '/assets/icon.png'
    }
  },

  // (optional)
  // HTML code injection
  html:
  {
    // (optional)
    // Markup inserted into server rendered webpage's <head/>.
    // Can be either a function returning a string or just a string.
    head: (path, { store }) => String

    // (optional)
    // Markup inserted to the start of the server rendered webpage's <body/>.
    // Can be either a function returning a string or just a string.
    bodyStart: (path, { store }) => String

    // (optional)
    // Markup inserted to the end of the server rendered webpage's <body/>.
    // Can be either a function returning a string or just a string.
    bodyEnd: (path, { store }) => String
  }

  // (optional)
  // When server-side rendering is enabled
  // `Accept-Language` and `User-Agent` HTTP headers
  // are  accessible inside this function.
  // `locales` are parsed from the `Accept-Language` HTTP header.
  getInitialState: ({ cookies, headers, locales }) => Object

  // Is React Server Side Rendering enabled?
  // (is `true` by default)
  //
  // (does not affect server side routing
  //  and server side page loading)
  //
  // Can be used to offload React server-side rendering
  // from the server side to the client's web browser
  // (as a performance optimization) by setting it to `false`.
  //
  renderContent: `true`/`false`
}
```

## All client side rendering options

```javascript
{
  ...

  // (optional)
  // Is fired after a user performs navigation (and also on initial page load).
  // Only on client side.
  // This exists mainly for Google Analytics.
  // `url` is a string (`path` + "search" (?...) + "hash" (#...)).
  // "search" query parameters can be stripped in Google Analytics itself.
  // They aren't stripped out-of-the-box because they might contain
  // meaningful data like "/search?query=dogs".
  // http://www.lunametrics.com/blog/2015/04/17/strip-query-parameters-google-analytics/
  // The "hash" part should also be stripped manually inside `onNavigate` function
  // because someone somewhere someday might make use of those "hashes".
  onPageRendered: ({ url, location, params, dispatch, useSelector }) => {}

  // (optional)
  // Same as `onNavigate()` but fires when a user performs navigation (not after it).
  // Only on client side.
  onBeforeNavigate: ({ url, location, params, dispatch, useSelector }) => {}

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
  // Not saying that this is even a "good" practice,
  // more like "legacy code", but still my employer
  // happened to have such binding, so I added this feature.
  // Still this technique cuts down on a lot of redundant "wiring" code.
  //
  // Don't use `redirect`/`goto` "pre-bound" in such a way
  // inside `load` because they won't work correctly there.
  //
  onStoreCreated: (store) => {}

  // (optional)
  // Configures Redux development tools.
  //
  // By default Redux development tools are enabled both in development (full-featured)
  // and production (log only, for performance reasons) if the web browser extension is installed.
  // The default behaviour is considered the best practice.
  //
  devtools:
  {
    // (optional)
    // A developer can supply his custom `compose` function
    // (e.g. when not using the web browser extension).
    // By default, "logOnlyInProduction" compose function is used
    // which is the best practice according to the web browser extension author:
    // https://medium.com/@zalmoxis/using-redux-devtools-in-production-4c5b56c5600f
    compose: import { composeWithDevToolsDevelopmentOnly } from '@redux-devtools/extension',

    // (optional)
    // Web browser extension options (when no custom `compose` is supplied).
    // https://github.com/reduxjs/redux-devtools/tree/main
    options: { ... }
  }
}
```

Client-side `render` function returns a `Promise` resolving to an object

```js
{
  store,   // (Redux) store
  rerender // Rerender React application (use it in development mode for hot reload)
}
```