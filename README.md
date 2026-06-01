# react-pages

[![npm version](https://img.shields.io/npm/v/react-pages.svg?style=flat-square)](https://www.npmjs.com/package/react-pages)
[![npm downloads](https://img.shields.io/npm/dm/react-pages.svg?style=flat-square)](https://www.npmjs.com/package/react-pages)

A tiny framework for building a "single-page" React application:

* Routing
* Fetching data from server
* Setting `<meta/>` and `<title/>`
* (optional) [Server-Side Render](#server-side-render)

## Are You Looking For Version `0.8`?

This readme is for the latest yet-unreleased "rewrite-from-scratch-in-progress" version `0.9` of `react-pages`. Most likely you're using a previous version `0.8` of `react-pages`, which is considered "stable", and you likely came here for the readme of that "stable" version. If that's the case, see the [readme](https://www.npmjs.com/package/react-pages) on the npm website, or the same readme in the `0.8` [branch](https://gitlab.com/catamphetamine/react-pages/-/tree/0.8.x?ref_type=heads).

## Currently Not Implemented

* Write the code as `*.ts` files in `src` directory and compile it to `*.js`/`*.d.ts` files in `lib` directory.
* Merge [`navigation-stack-react`](https://gitlab.com/catamphetamine/navigation-stack-react) repository code in this package.
* Add a link to `react-pages` in `navigation-stack` readme.
* When calling `applyMeta()` function, also store the argument value in some kind of "context". This value should be passed later to `patchMeta()` function.
* In `/meta-tags` folder, add a function `addMetaTags(meta[])` which returns a "remove the added meta tags" function. Add functions: `getMetaTags(meta[])`, `removeMetaTags(meta[])`. These functions will be used in `<RouteRenderer/>` component when rendering initial page and rendering new pages.
* In `/route-matcher` folder, validate that there's only one route with `path: "*"` Use `RouteMatcher` class from `/route-matcher` folder to get `RouteSegment[]` array for a given `location.pathname` on client side and server side. Also add a function `excludeOverlappingRouteSegments(route1, route2)` which would exclude overlapping route segments from `route1`. Mark this function as unused because it won't really be used because the `load` function is only supported on the leaf route segment. Validate that only the leaf route segment has a `load` function defined. Support `path: "*"` as a fallback route. Support `.status` numeric property on a page component. Validate that a `path` doesn't have leading or trailing slashes (also explain in the error message that instead of "/" just leave the `path` unspecified).
* In `./server-render/render.ts`, calculate the actual HTTP status code and `<meta/>` tags. Emit the status code before React rendering. Insert the `<meta/>` tags in `Html` component's `<head/>` before React rendering. Update the README example to show the correct usage of status code and `<meta/>` tags.
* In `./browser-render/render.ts`, calculate the `<meta/>` tags. Insert the `<meta/>` tags in `Html` component's `<head/>` before React "hydration".
* Add some `context` parameter to `.meta()` function. From there, it might read the user's selected `language` and output translated labels.
* In routes configuration, `component` could be a component or a function like `() => import('.../Component')`.
* Add `useReplaceUrlQuery()` hook which doesn't trigger a transition from one page to another.
* Add `usePageState()` hook. If `.load()` function returns `state` property, it becomes the initial value for the page state. The hook accepts an optional `key` argument. Wrap each route segment `component` in a `<RouteSegmentContextProvider/>` which provides `RouteSegmentContext` to each route segment `component` (accessible via hook `useRouteSegmentContext()`). The context has the `component` itself.
  * Document `usePageState()` hook. Document that the page state persists throughout "Back"/"Forward" navigation: in that case, `.load()` function is not called and any pre-existing state is reused.

```js
import { useState, useCallback, useMemo } from 'react'

import useLocation from './useLocation.js'
import { getContext } from '../context.js'
import { useIsLeafRouteSegment } from '...'

export default function usePageState(key) {
  // const { component, path } = useRouteSegmentContext()

	const isLeafRouteSegment = useIsLeafRouteSegment()
	if (!isLeafRouteSegment) {
		throw new Error('`usePageState()` hook can only be used inside the bounds of a "leaf" route component')
	}

  const location_ = useLocation()
  const location = useMemo(() => location_, [])
  if (location_ !== location) {
    console.log('Initial location', location)
    console.log('Current location', location_)
    throw new Error('Unexpected change of `location` in `usePageState()` hook')
  }

  // The most up-to-date page state value.
  const pageState = getContext().pageStateByLocationKey[location.key]

  const pageStateInitialValue = useMemo(() => pageState, [])
  const [state, setState] = useState(pageState)

  // Because `usePageState()` hook could be called from multiple places in an application,
  // Same parts of state could be read or written from different parts of the application.
  // This means that in order to stay really up-to-date with such potential changes,
  // there has to exist a subscription mechanism to listen for any potential changes.
  useEffect(() => {
    // React doesn't guarantee anything about when `useEffect()` callback is executed.
    // Since it could be after an arbitrary delay, it should re-check that
    // the latest available `pageState` value is the same one that was observed
    // when initially rendering the component.
    const pageState = getContext().pageStateByLocationKey[location.key]
    if (pageState !== pageStateInitialValue) {
      setState(pageState)
    }
    // Subscribe to page state mutations for this location key.
    getContext().pageStateMutationObserversByLocationKey[location.key] = (getContext().pageStateMutationObserversByLocationKey[location.key] || []).concat(setState)
    return () => {
      // Unsubscribe from page state mutations for this location key.
      getContext().pageStateMutationObserversByLocationKey[location.key] = getContext().pageStateMutationObserversByLocationKey[location.key].filter(_ => _ !== setState)
    }
  }, [])

  // Updates page state.
  const onSetState = useCallback((newValueOrTransformFunction) => {
    // Get the new value.
    const newValue =
      typeof newValueOrTransformFunction === 'function'
        // Here, it passes `getContext().pageStateByLocationKey[location.key]` argument
        // rather than just `state` because `state` could potentially be stale
        // due to the "asynchronous" nature of `useState()` hook.
        ? newValueOrTransformFunction(getContext().pageStateByLocationKey[location.key])
        : newValueOrTransformFunction
    // Update the value.
    getContext().pageStateByLocationKey[location.key] = newValue
    // Notify any mutation observers (including self).
    for (const observer of (getContext().pageStateMutationObserversByLocationKey[location.key] || [])) {
      observer(newValue)
    }
  }, [])

  return [state, onSetState]
}
```

* Force-remount the page component every time when location changes (with potential override of this behavior using some form of `shouldUnmountPageOnLocationChange()` function parameter).
* Add `state` parameter in `.meta()` function.
* Don't automatically copy over the title to `og:title` and description to `og:description`, because all them are [different](https://d3creative.uk/blog/title-and-meta-description-vs-open-graph).
* Should `getCookie()` parameter be removed from `load()` function? If yes then should the cookie be moved to navigation context object or something.
* Add a parameter function that will be called when a `load()` function throws an error. That function should return an object of shape `{ redirect: ... }`. Write the name of that parameter function in the "Fetching Data From Server" section of the readme.
* Add the relevant TypeScript types.
* CHANGELOG:
  * Rewrote the code from scratch. Import paths, exports, functions, options — assume that everything changed.
  * Removed dependencies: `redux`, `found`, `farce`.
  * The new code is written in TypeScript.

## Install

```
npm install react-pages --save
```

## Use

Start with defining all possible routes in the application.

#### ./src/routes.js

```js
// The `App` component is a global "wrapper" for all pages
import App from './components/App'

// The pages
import Home from './pages/Home'
import Item from './pages/Item'
import Items from './pages/Items'

export default [{
  component: App,
  children: [
    { component: Home },
    { component: Items, path: '/items' },
    { component: Item, path: '/items/{id}' }
  ]
}]
```

#### ./src/components/App.js

```js
export default ({ children }) => (
  <section>
    <header>
      Header
    </header>
    <nav>
      Navigation Menu
    </nav>
    {/* The page components will be rendered here */}
    {children}
    <footer>
      Copyright
    </footer>
  </section>
)
```

#### ./src/pages/Home.js

```js
const Home = () => (
  <main>
    This is a home page
  </main>
)

Home.meta = () => ({
  title: 'Home Page'
})

export default Home
```

#### ./src/pages/Items.js

```js
import { Link, usePageState } from 'react-pages'

const Items = () => {
  const [items, setItems] = usePageState('items')
  return (
    <main>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>
            <Link to={`/items/${item.id}`}>
              Item {item.id}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

Items.load = async () => {
  const response = await fetch('https://example.com/items')
  const items = await response.json()
  return {
    state: {
      items
    }
  }
}

Items.meta = () => ({
  title: 'Items'
})

export default Items
```

#### ./src/pages/Item.js

```js
import { usePageState } from 'react-pages'

const Item = () => {
  const [item, setItem] = usePageState('item')
  return (
    <main>
      <h1>
        Item {state.item.id}
      </h1>
      <p>
        {state.item.description}
      </p>
    </main>
  )
}

Item.load = async ({ params }) => {
  // `params` are the parameters in the URL path.
  const response = await fetch(`https://example.com/items/${params.id}`)
  const item = await response.json()
  return {
    state: {
      item
    }
  }
}

Item.meta = ({ state }) => ({
  title: `Item ${state.item.id}`
})

export default Item
```

After all routes have been defined, all that's left is to call `render()` function with the `routes` argument at application start.

#### ./src/index.js

```js
import render from 'react-pages/render'
import routes from './routes.js'

render(routes, { to: document.getElementById('root') })
```

#### ./index.html

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
    <!-- "/index.js" URL should point to the "./src/index.js" file. -->
    <!-- The browser will run the code in that file at application start. -->
    <script src="/index.js"></script>
  </body>
</html>
```

## Server-Side Render

It's really easy to add server-side rendering to the example application above, if required.

#### ./src/server.js

```js
import fs from 'fs'
import http from 'http'

import render from 'react-pages/server-render'
import routes from './routes.js'

// A React component that renders a full HTML page.
// `children` will be the rendered route.
const Html = ({ children }) => (
  <html>
    <head>
      <title>Example</title>
    </head>
    <body>
      {children}
    </body>
  </html>
)

// Create an HTTP server.
const server = http.createServer((req, res) => {
  const htmlStream = await render(routes, {
    // The requested URL (relative).
    url: req.url,
    // The React component that render a full HTML page.
    Html,
    // The application bundle *.js file.
    scriptUrl: '/bundle.js'
  })
  // Output status code and content type.
  res.writeHead(200, { 'Content-Type': 'text/html' })
  // Stream the rendered HTML.
  htmlStream.pipe(res)
})

// Start the HTTP server.
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})
```

```
node src/server.js
```

## Fetching Data From Server

To "load" a page before it gets rendered, define a static `load` property function on the page component.

The `load` function must return an object with the following properties:

* `redirect?: object` — If the user should be redirected to another page.
* `state?: object` — The initial values for the page state.

If the `load` function throws an error, ... parameter function will be called with arguments ... and it must return an object with a `redirect` property.

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

The `load` function receives an object as its only argument:

```javascript
function Page() {
  const [data, setData] = usePageState('data')
  return (
    <main>
      Data: {data}
    </main>
  )
}

Page.load = async (parameters) => {
  const {
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
    params
  } = parameters

  // Send HTTP request and wait for response.
  // For example, it could just be using the standard `fetch()` function.
  const response = await fetch(`https://data-source.com/data/${params.id}`)
  const data = await response.json()

  // Optionally return an object containing page component `props`.
  // If returned, these props will be available in the page component,
  // same way it works in Next.js in its `getServerSideProps()` function.
  return {
    // `data` prop will be available in the page component.
    state: {
      data
    }
  }
}
```

## Page HTTP response status code

To set a custom HTTP response status code for a specific route, set a numeric `status` property on the corresponding page component.

```js
const ErrorPage = () => (
  <main>
    Error
  </main>
)

ErrorPage.meta = () => ({
  title: 'Error'
})

ErrorPage.status = 500

export default ErrorPage
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
    state: {
      bodyBuilder: await getBodyBuilderInfo(params.id)
    }
  }
}

Page.meta = ({ state, context }) => {
  const { bodyBuilder } = state

  return {
    // `<meta property="og:site_name" .../>`
    siteName: 'International Contest',

    // Webpage `<title/>` will be replaced with this one
    // and also `<meta property="og:title" .../>` will be added.
    title: bodyBuilder.name,

    // `<meta property="og:description" .../>`
    description: bodyBuilder.biography,

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
}
```

The parameters of a `meta` function are:

* `props` — Any `props` returned from the `load()` function.
* `useSelector` — A hook that could be used to access Redux state.
* `usePageStateSelector` — A hook that could be used to access "page-specific" Redux state.

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

App.meta = () => {
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

### Get current location

Inside a `load` function: use the `location` parameter.

Anywhere in a React component: use `useLocation()` hook.

```js
import { useLocation } from 'react-pages'

const location = useLocation()
```

The `location` returned from `useLocation()` hook is the "initial" location for the page and it doesn't reflect any subsequent changes, if any, that were made using [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) — `history.pushState()`, `history.replaceState()`, etc — or via `useReplaceUrlQuery()` hook.

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

If the current location URL query needs to be updated while staying on the same page, i.e. without it being considered a "navigation" event, that could be done via `useReplaceUrlQuery()` hook.

```javascript
import { useReplaceUrlQuery } from 'react-pages'

function Page() {
  const replaceUrlQuery = useReplaceUrlQuery()

  // Updates the URL to be:
  // "https://example.com/search" → "https://example.com/search?text=abc"
  const onSearch = (event) => {
    replaceUrlQuery({
      text: event.target.value
    })
  }

  return (
    <input onChange={onSearch}/>
  )
}
```

Any changes made via `useReplaceUrlQuery()` won't be reflected in the `location` that is returned from `useLocation()` hook because that hook returns the "initial" location for the page.

To go "Back" or "Forward", one could use `useGoBack()` or `useGoForward()` hooks.

```javascript
import { useGoBack, useGoForward } from 'react-pages'

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

<!--
If someone prefers to interact with [`found`](https://github.com/4Catalyzer/found) `router` directly then it could be accessed at any page: either as a `router` property of a page component or via [`useRouter`](https://github.com/4Catalyzer/found#programmatic-navigation) hook.

```js
import React from 'react'
import { useRouter } from 'react-pages'

export default function Component() {
  const { match, router } = useRouter()
  ...
}
```
-->

### Changing current location (outside of React component code)

Perhaps use `NavigationStack`.

## License

[MIT](LICENSE)
