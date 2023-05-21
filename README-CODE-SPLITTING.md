## Concept

"Code splitting" is a term used for applications not using a monolythic javascript bundle.

Suppose an app is being developed. First it's small and so is its bundle so no code splitting is used. After a couple of years though many new pages are added which don't relate to each other but are still part of the app (e.g. user settings pages vs the actual website content). As a result, the javascript (and CSS) bundle grows in size reaching several megabytes. While it might seem like no big deal on PCs it is noticeable on non-flagship smartphones for example. Not only the time it takes to download the whole bundle until the website is operational but also the time to parse this bundle by the javascript engine (and the CSS engine too).

To circumvent such performance issues on low-power mobile devices one can employ a "code splitting" strategy where each route (code + CSS) is downloaded separately as it's being accessed. With this approach a bundler creates a separate "chunk" for each page and it is then loaded dynamically via `import(url).then(...)`.

## Implementation

First, set "code splitting" mode to "ON".

#### ./src/react-pages.js

```js
export default {
  routes,
  reducers, // (optional)
  codeSplit: true
}
```

Then, in routes, replace some or all `Component={...}` with `getComponent={() => import(...).then(_ => _.default)}` and replace **all** `load` and `meta` static properties on page components with `load` and `meta` properties on routes themselves.

```js
{
	path: '/',
	getComponent: () => import('./Application.js').then(_ => _.default),
	meta: state => ({ title: '...' }),
	load: async ({ dispatch, useSelector, params, ... }) => ...,
	...
}
```

<!-- getTranslation={{ ru: () => import('./Application.ru.json'), ... }} -->

The file structure can be:

* `./src/pages/Page.js` for the React page component.

* `./src/pages/Page.load.js` for `load`.

* `./src/pages/Page.meta.js` for `meta`.

<!--
* `./src/pages/Page.lang.js` for `getTranslation()`.

* `./src/pages/Page.ru.json` for translated messages.
-->

#### `./src/pages/Page.js`

```js
import React from 'react'

export default function Page() {
	return (
		<section>
			...
		</section>
	)
}
```

#### `./src/pages/Page.load.js`

```js
import { fetchPageData } from '../redux/page'

export default async ({ dispatch, useSelector, params, ... }) => {
	await dispatch(fetchPageData(params.id))
}
```

#### `./src/pages/Page.meta.js`

```js
export default ({ props, useSelector }) => ({
	title: '...'
})
```

<!--
#### `./src/pages/Page.lang.js`

```js
export default {
	ru: () => import(`./Page.ru`)
}
```

#### `./src/pages/Page.ru.json`

```js
{
	"title": "Заголовок"
}
```
-->

Since `load` property is not used on route components for code splitting there are three route properties to emulate the `load` property behavior:

* `load` — the equivalent of `load` property on route components, is called both on client and server.

* `loadClient` — the equivalent of `load = { load(), client: true }`, is only called on client.

* `loadClientAfter` — the equivalent of `load = { load(), client: true, blockingSibling: true }`, is only called on client and after `load` and `loadClient` have finished.

Each of the loading functions can also have a static `options` property where available options are same as for `load` property normally set on route components: `{ client, blocking, blockingSibling }`.

See the [example project](https://github.com/catamphetamine/webpack-react-redux-server-side-render-example/pull/43) showcasing "code splitting".