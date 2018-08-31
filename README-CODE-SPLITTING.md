## Concept

"Code splitting" is a term used for applications not using a monolythic javascript bundle.

Suppose an app is being developed. First it's small and so is its bundle so no code splitting is used. After a couple of years though many new pages are added which don't relate to each other but are still part of the app (e.g. user settings pages vs the actual website content). As a result, the javascript (and CSS) bundle grows in size reaching several megabytes. While it might seem like no big deal on PCs it is noticeable on non-flagship smartphones for example. Not only the time it takes to download the whole bundle until the website is operational but also the time to parse this bundle by the javascript engine (and the CSS engine too).

To circumvent such performance issues on low-power mobile devices one can employ a "code splitting" strategy where each `<Route/>` (code + CSS) is downloaded separately as it's being accessed. With this approach a bundler creates a separate "chunk" for each page and it is then loaded dynamically via `import(url).then(...)`.

## Implementation

First, set "code splitting" mode to "ON".

#### ./src/react-website.js

```js
export default {
  routes,
  reducers,
  codeSplit: true
}
```

Then, in routes, replace all `Component={...}` with `getComponent={() => import(...)}` and instead of adding `@preload()` and `@meta()` decorators to page components add `preload` and `meta` properties to `<Route/>`s themselves.

```js
<Route
	path="/"
	getComponent={() => import('./Application.js')}
	meta={state => ({ title: '...' }))
	preload={async ({ dispatch, getState, params, ... }) => ...}>
	...
</Route>
```

<!-- getTranslation={{ ru: () => import('./Application.ru.json'), ... }} -->

The file structure can be:

* `./src/pages/Page.js` for the React page component.

* `./src/pages/Page.data.js` for `preload`.

* `./src/pages/Page.meta.js` for `meta`.

<!--
* `./src/pages/Page.lang.js` for `getTranslation()`.

* `./src/pages/Page.ru.json` for translated messages.
-->

#### `./src/pages/Page.js`

```js
import React from 'react'

export default class Page extends React.Component {
	render() {
		const { translate } = this.props
		return (
			<section>
				<h1>{translate('title')}</h1>
			</section>
		)
	}
}
```

#### `./src/pages/Page.data.js`

```js
import { fetchPageData } from '../redux/page'

export default async ({ dispatch, getState, params, ... }) => {
	await dispatch(fetchPageData(params.id))
})
```

#### `./src/pages/Page.meta.js`

```js
export default (state) => ({
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

Since `@preload()` decorator is not used on `<Route/>`s for code splitting there are three `<Route/>` properties to emulate `@preload()` behaviour:

* `preload` — the equivalent of `@preload(...)`, is called both on client and server.

* `preloadClient` — the equivalent of `@preload(..., { client: true })`, is only called on client.

* `preloadClientAfter` — the equivalent of `@preload(..., { client: true, blockingSibling: true })`, is only called on client and after `preload` and `preloadClient` finish.

Each of the preload functions can also have a static `options` property where `options` are the same as the `options` for `@preload()`.