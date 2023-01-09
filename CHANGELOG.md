<!--
As the project grows the `webpack-react-redux-server-side-render-example` setup
gets slow hot-reload times because the rendering service is being re-launched
on every code change and starting up the Node.js process starks taking a long time.
This could be changed into the rendering service being run not via `nodemon`
but via the standard `node` instead meaning that it wouldn't re-launch on every code change.
Instead, the rendering service would always return a dummy `index.html` file contents
like it would in case of client-side-only rendering.
In that case rendering service won't perform any routing or preloading.
It would just return the base HTML structure without any route-specific stuff.
-->

<!-- Maybe replace ActivityIndicator with something else (not requiring ems for width, using percentages instead). -->

<!-- Maybe make `showLoadingInitially: true` a default setting. -->

<!-- Maybe replace `getRoutesByPath()` with `matcher.getRoutes(match)` provided by `found` out-of-the-box: https://github.com/4Catalyzer/found/pull/634#issuecomment-558895066 -->

<!-- Maybe rename `onNavigate()` to `onPageView()`. -->

0.6.23 / 09.01.2023
==================

* Re-added CommonJS exports

0.6.13 / 04.06.2022
==================

* Added `http.useCrossDomainCookies({ getDomain(), belongsToDomain(), url, originalUrl })` setting.

0.6.3 / 26.04.2022
==================

* Moved to a fork of `found`, initially because `found` [doesn't support React 18](https://github.com/4Catalyzer/found/issues/965), and after that because specifying `redux` and `react-redux` in `peerDependencies` is better than specifying those in `dependencies`.

* Moved `authentication` settings property to `http.authentication`. The old property still works but is considered deprecated.

* Added `createStore(settings, options)` function that returns a Redux `store` and is exported from `/client` subpackage. The default `render()` function exported from the same subpackage now accepts a `store` option. This way, a developer could first create a `store` and then pass it to the `render()` function: this way, the application rendering could be migrated to some other framework like Next.js while still leaving all Redux-related code (actions, reducers) as is, and it's supposed to work that way because Redux store operates independently from the rendering framework.

```js
import { render, createStore } from 'react-pages/client'

import routes from './routes.js'

// Redux reducers that will be combined into
// a single Redux reducer via `combineReducers()`.
import * as reducers from './redux/index.js'

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
			accessToken(options) {}
		},

		// (optional)
		// Catches HTTP errors.
		onError(error, options) {},

		// (optional)
		// Transforms an HTTP error to a Redux state `error` property.
		getErrorData(error) {},

		// (optional)
		// Transforms HTTP request URLs.
		// For example, could transform relative URLs to absolute URLs.
		transformUrl(url) {}
	},

	// (optional)
	// Catches errors thrown from page `load()` functions.
	onError(error, options) {},

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

0.6.0 / 23.04.2022
==================

* Only provides ["ES Modules"](https://nodejs.org/api/esm.html) exports now (no "CommonJS" exports).

* Requires React `18`.

* Updated `react-redux` from `7` to `8`.

* Updated `superagent` from `6` to `7`.

* An experimental migration to [`found@1.1.1`](https://github.com/4Catalyzer/found/issues/964).

0.5.5 / 07.12.2021
==================

* Added `useLocation()` hook.

0.5.4 / 03.12.2021
==================

* Added `dispatch` parameter on `onError()` handler in settings.

0.5.3 / 30.11.2021
==================

* Fixed `<Link ref/>`.

* Added an exported `updateMeta(metaProperties)` function that could be used to update some `meta` properties in real time.

0.5.0 / 14.11.2021
==================

* Updated dependencies.

* (breaking change) Bumped peer dependencies:

  * Bumped `react` peer dependency to `17.x`. No particular reason.
  * Also, update your application's `react-redux` package version, otherwise it might throw a weird error: `"... Either wrap the root component in a <Provider> ..."`.

* (breaking change) Removed exported "decorators":
  * `preload` — Set `.load` on page component function instead.
  * `onPageLoaded` — Set `.onLoaded` on page component function instead.
  * `meta` — Set `.meta` property on page component function instead.
  * `translate` — Not used.

* (breaking change) Page component's `meta` can now only be a function. Previously it could be an object and would automatically get converted to a function under the hood.

0.4.2 / 12.01.2021
==================

* Refactored "instant back" stuff. Added `canGoForwardInstantly()` function (analogous to `canGoBackInstantly()`).

0.4.1 / 07.01.2021
==================

* (misc) Added `goForward()` exported function (analogous to `goBack()`).

0.4.0 / 19.12.2020
==================

* Updated dependencies (`found` and miscellaneous).

* (breaking change) Had to move the "client" render function to its own subpackage: `react-pages/client`: `import { render } from 'react-pages'` -> `import { render } from 'react-pages/client'`.

0.3.0 / 13.11.2019
==================

* `redux.simpleAction()`'s `action()` argument has been removed. Instead, Redux action object is accessible directly in the reducer function as a second argument: `redux.simpleAction((state, actionArgument) => newState)`. In other words: `redux.simpleAction()` now can only take either `(eventName, reducer)` arguments or `(reducer)` argument.

0.2.7 / 27.09.2019
==================

* Fixed `base.html` (`static-site-generator`).

* The `path` argument of server-side settings `assets(path)`, `html.head(path)`, `html.bodyStart(path)`, `html.bodyEnd(path)` now has the ending slash character (`"/"`) trimmed.

0.2.3 / 23.09.2019
==================

* Released a useable version. Seems to be working for now. More tests will be run later. After the library is tested some more, version `1.0.0` will be released.