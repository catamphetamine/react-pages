This section contains advanced topics. This means that the features described here are for those who have already spent some time with this library and therefore won't be overwhelmed and confused by the topics covered here.

## react-router-redux

I didn't build [`react-router-redux`](https://github.com/reactjs/react-router-redux) functionality into this library because I thought that Redux state is actually not intended for storing router state. See [PHILOSOPHY](https://github.com/catamphetamine/react-website/blob/master/PHILOSOPHY.md).

## CSRF protection

[Cross-Site Request Forgery attacks](http://docs.spring.io/spring-security/site/docs/current/reference/html/csrf.html) are the kind of attacks when a legitimate user is tricked into navigating a malicious website which, upon loading, sends a forged HTTP request (GET, POST) to the legitimate website therefore performing an action on behalf of the legitimate user (because the "remember me" cookie is also sent along).

How can a legitimate website guard its users from such attacks? One solution is to ignore the "remember me" cookie and force reading its value from an HTTP header. Because CSRF attacks can't send custom headers (at least using bare HTML/Javascript, without exploiting Adobe Flash plugin bugs, etc), this renders such hacking attempts useless.

Therefore the API should only read "remember me" token from an HTTP header. The client-side application will read "remember me" cookie value and send it as part of an HTTP header for each HTTP request. Alternatively "remember me" token can be stored in a web browser's `localStorage`.

So, **javascript is required** on the client side in order for this CSRF attacks protection to work (because only javascript can set HTTP headers). If a developer instead prefers to run a website for javascript-disabled users (like [Tor](https://www.deepdotweb.com/)) then the only way is to authenticate users in REST API endpoints by a "remember me" cookie rather than `Authorization` HTTP header. This will open the website users to various possible javascriptless CSRF attacks.

## `@preload()`

`@preload()` decorator seems not working for no reason (though it definitely works) then try to place it on top of all other decorators. Internally it adds a special static method to your `Route`'s `component` and some 3rd party decorators on top of it may not retain that static method (though all proper decorators nowadays do retain static methods and variables of the decorated components using [`hoist-non-react-statics`](https://github.com/mridgway/hoist-non-react-statics)).

## `@onPageLoaded()`

When using `{ client: true }` `@preload()`s it's sometimes required to perform some actions (e.g. adjust the current URL) after those `@preload()`s finish (and after the browser navigates to the preloaded page). While with regular `@preload()`s it could be done using `componentDidMount()` (though only on the client side) such an approach wouldn't work for `{ client: true }` `@preload()`s because they're called after `componentDidMount()`. The solution is `@onPageLoaded()` decorator which takes a function parameter, exactly as `@preload()` decorator does, with an extra `history` parameter.

```js
import { onPageLoaded, replaceLocation } from 'react-website'

@onPageLoaded(function({ dispatch, getState, history, location, parameters, server }) {
  if (isAnIdURL(location.pathname)) {
    replaceLocation(replaceIdWithAnAlias(location, getState().userProfilePage.userProfile), history)
  }
}
```

## Restricted routes

In most applications some routes are only accessible by a specific group of users. One may ask what route restriction mechanisms does this library provide. The answer is: you actually don't need them. For example, in my projects the `@preload()` function itself serves as a guard by querying a REST API endpoint which performs user authentication internally and throws a "403 Access Denied" error if a user doesn't have the permission to view the page.

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

## onEnter

`react-router`'s `onEnter` hook is being called twice both on server and client because `react-router`'s `match()` is called before preloading and then the actual navigation happens which triggers the second `match()` call (internally inside `react-router`). This is not considered a blocker because in this library `@preload()` substitutes `onEnter` hooks so just use `@preload()` instead. Double `onEnter` can be fixed using `<RouterContext/>` instead of `<Router/>` but I see no reason to implement such a fix since `onEnter` is simply not used.

## Redux module event and property naming

By default it generates `"_PENDING"`, `"_SUCCESS"` and `"_ERROR"` Redux events along with the corresponding camelCase properties in Redux state. One can customize that by supplying custom `reduxEventNaming` and `reduxPropertyNaming` functions.

#### react-website.js

```js
import reduxSettings from './react-website-redux'

export default {
  // All the settings as before

  ...reduxSettings
}
```

#### react-website-redux.js

```js
import { underscoredToCamelCase } from 'react-website'

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
import { reduxModule, eventName } from 'react-website'
import reduxSettings from './react-website-redux'

const redux = reduxModule('BLOG_POST', reduxSettings)
...
```

Notice the extraction of these two configuration parameters (`reduxEventNaming` and `reduxPropertyNaming`) into a separate file `react-website-redux.js`: this is done to break circular dependency on `./react-website.js` file because the `routes` parameter inside `./react-website.js` is the `react-router` `./routes.js` file which `import`s React page components which in turn `import` action creators which in turn would import `./react-website.js` hence the circular (recursive) dependency (same goes for the `reducer` parameter inside `./react-website.js`).

## Internal `render()` function

For some advanced use cases (though most likely no one's using this) the internal `render()` function is exposed.

```js
import { render } from 'react-website/server'
import settings from './react-website'

try {
  // Returns a Promise.
  //
  // status  - HTTP response status
  // content - rendered HTML document (a Node.js "Readable Stream")
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
  content.pipe(response)
} catch (error) {
  response.status(500)
  response.send('Internal server error')
}
```

## All `react-website.js` settings

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
  // React page component (`children` property)
  // is rendered inside this "container" component.
  // (e.g. Redux `<Provider/>`,
  //  `react-hot-loader@3`'s `<AppContainer/>`
  //  and other "context providers")
  //
  // By default it just wraps everything with Redux `<Provider/>`:
  //
  // export default ({ store, children }) => <Provider store={ store }>{ children }</Provider>
  //
  container: require('./src/client/container')

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
    url: (path, isServerSide) =>
    {
      // In this case `.application` configuration parameter may be removed
      return `https://api-server.com${path}`
    }
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

    // By default the `http` utility methods
    // only accept relative URLs.
    // Set this flag to `true` to allow absolute URLs.
    // (is `false` by default)
    allowAbsoluteURLs: true

    // (optional)
    error: (error, { url, path, redirect, dispatch, getState }) => console.error(error)
    //
    // Is called when `http` calls either fail or return an error.
    // Is not called during `@preload()`s and therefore
    // can only be called as part of an HTTP call
    // triggered by some user interaction in a web browser.
    //
    // For example, Auth0 users may listen for
    // JWT token expiration here and redirect to a login page.
    // There's an alternative solution for handling access token expiration:
    // the `http.catch()` function parameter (see below).

    // (optional)
    errorState: (error) => ({ ... })
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
    // By default `errorState` takes the `application/json` HTTP response payload
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
    // httpRequest().catch((error) => {
    //   return catch(error, 0, helpers).then(httpRequest).catch((error) => {
    //     return catch(error, 1, helpers).then(httpRequest).catch((error) => {
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

    // Sets `{ client: true }` option for all `@preload()`s.
    // Should be set when the application is client-side only
    // (e.g. hosted entirely on an Amazon S3 cloud).
    client: true
    // (is `false` by default)
  }

  // (optional)
  // Can handle errors occurring inside `@preload()`.
  // For example, if `@preload()` throws a `new Error("Unauthorized")`
  // then a redirect to "/unauthorized" page can be made here.
  error: (error, { path, url, redirect, dispatch, getState, server }) => redirect(`/error?url=${encodeURIComponent(url)}&error=${error.status}`)

  // (optional)
  authentication:
  {
    // (optional)
    protectedCookie: 'cookie-name'
    //
    // The "remember me" cookie can be further protected
    // by making it non-readable in a web browser (the so called "httpOnly" cookies).
    // But how a web browser is gonna get the cookie value to send it as part of an HTTP header?
    // The answer is: the cookie can be read on the server side when the page is being rendered,
    // and then be inserted on a page as a javascript variable which is captured by
    // `http` utility HTTP request methods and immediately removed from the global scope.
    // Therefore this variable will only be accessible inside `http` utility methods
    // and an attacker won't be able neither to read the cookie value nor to read the variable value.
    // This way the only thing a CSRF attacker could do is to request a webpage
    // (without being able to analyse its content) which is never an action so it's always safe.
    // And so the user is completely protected against CSRF attacks.
    //
    // This can be an Auth0 "refresh token", for example.
    // https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
    // If it is, then it's gonna be available in `http.catch()` function
    // and can be used there to refresh expired (short lived) access tokens.
    // If it's the case and `authentication.protectedCookie` is a "refresh token",
    // then also set `authentication.accessToken()` function parameter
    // to return the currently used "access token":
    // this "access token" will always be set automatically
    // in the "Authorization" HTTP header
    // when using `http` utility inside Redux actions.

    // (optional)
    accessToken: (getCookie, { store }) => String
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
  initialize: async (httpClient) => ({})
  // (or same without `async`: (httpClient) => Promise.resolve({})

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
  localize: ({ store }, preferredLocales) => ({ locale: preferredLocales[0], messages: { 'page.heading': 'Test' } })

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
  // Is called after all `@preload()`s finish and before React renders.
  beforeRender: async ({ dispatch, getState }) => {}

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
    compose: require('remote-redux-devtools/composeWithDevTools')

    // (optional)
    // Web browser extension options (when no custom `compose` is supplied).
    // https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
    options: { ... }
  }

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
  store,   // (Redux) store
  rerender // Rerender React application (use it in development mode for hot reload)
}
```

## To do

* (minor) Server-side `@preload()` redirection could be rewritten from `throw`ing special "redirection" `Error`s into `.listen()`ing the server-side `MemoryHistory` but since the current "special redirection errors" approach works and has no operational downsides I think that there's no need in such a rewrite.