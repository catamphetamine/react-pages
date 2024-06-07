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

0.8.6 / 05.06.2024
==================

* Changed the `location` object that is returned from `useNavigationLocation()` hook.
  * If anyone used `useNavigationLocation()` to get a `url: string` from it then that URL might've changed if the "get URL" function prepends `location.origin` to it.

0.8.0 / 09.05.2024
==================

* Renamed `onNavigate` client-side render option to `onPageRendered`.
* Removed hooks:
  * `useNavigationStartEffect()`
  * `useNavigationEndEffect()`
  * `useSelectorForLocation()`
* Added hooks:
  * `usePageStateSelector()`
  * `usePageStateSelectorOutsideOfPage()`
* Added hooks:
  * `useBeforeNavigateToAnotherPage()`
  * `useBeforeRenderAnotherPage()`
  <!-- * `useAfterNavigatedToAnotherPage()` -->
  * `useAfterRenderedThisPage()`
  * `useBeforeRenderNewPage()`
  * `useAfterRenderedNewPage()`
* Removed function: `isInstantBackAbleNavigation()`. Use the new `useBeforeNavigateToAnotherPage({ instantBack })` or `useBeforeRenderAnotherPage({ instantBack })` hooks instead.
<!-- * Any actions `dispatch()`ed from `.load()` functions can now only modify the parts of the Redux state that've been explicitly marked as `pageStateReducerNames` in the settings file (`react-pages.js`). -->

0.7.12 / 26.11.2023
==================

Added React hook alternatives to `dispatch()`-able navigation actions. The rationale is that in React components code writing `const goto = useNavigate()` and then `goto('/page')` a little bit cleaner than writing `const dispatch = useDispatch()` and then `dispatch(goto('/page'))`.

* `dispatch(goto())` → `useNavigate()()`
* `dispatch(redirect())` → `useRedirect()()`
* `dispatch(pushLocation())` → `useLocationHistory().push()`
* `dispatch(replaceLocation())` → `useLocationHistory().replace()`
* `dispatch(goBack())` → `useGoBack()()`
* `dispatch(goForward())` → `useGoForward()()`

0.7.0 / 22.05.2023
==================

* `.load()` or `.meta()` functions can now be present only on the `Component` of either a "root" or a "leaf" route, i.e. only on the root `Component` or a page's `Component`.

* Removed the `meta` property from `react-page.js` settings file. Instead, set `.meta()` function on the "root" route's `Component`.

* The `.load()` function can now return an object of shape `{ props }` or an object of shape `{ redirect }`, similar to `Next.js`'s [`getServerSideProps()`](https://nextjs.org/docs/pages/api-reference/functions/get-server-side-props).

* The `.load()` function no longer receives `redirect` parameter. Instead, return an object of shape `{ redirect: { url: '/some/url' } }`.

* The `.meta()` function's arguments have changed: previously it was `(state)`, now it's `({ props, useSelector })` where `props` are the `{ props }` returned from the `.load()` function and `useSelector()` behaves analogous to the `useSelector` hook imported from `react-redux`.

* The `updateMeta()` function is no longer exported. Instead, the meta is supposed to refresh itself when the values returned from `useSelector()` change, so it behaves like a React "hook".

  * In cases when the `meta()` function has to access some state that is local to the page component and is not stored in Redux state, a developer could pass such state to the `meta()` function by setting `metaComponentProperty` property of a page component to `true` and then rendering the `<Meta/>` component manually inside the page component. See the readme for more details.

  <!-- * There might also be "hacky" edge-cases when the application chooses to patch the `meta()` function of a component in real time for whatever reason. In those cases, a manual re-calculation and re-applying of the `meta()` is required after the patching. To do that, use the `refreshMeta()` function that is returned from the exported `useRefreshMeta()` hook. -->

* Removed `load.getContext()` parameter from `react-pages.js` settings file.

* Renamed Redux state object key from `preload` to something else. Developers shouldn't access it normally.

* Renamed Redux state key from `preload.pending` to something else. Developers shouldn't access it normally. Use the new `useLoading()` hook instead to get the value of used-to-be `state.preload.pending`.

* Removed Redux state `preload.immediate` property due to not being used.

<!-- * Added optional `default: true` property on routes in routes configuration. It can only be used along with `status: 4xx / 5xx` property. When `default: true` is set for such route, it's gonna be a default page to redirect to in case of the corresponding HTTP errors arising when executing `load()` functions when loading pages. -->

<!-- * Removed `errorPages` configuration parameter in `react-pages.js`. Instead, set the `default: true` flag on a route, as described above. -->

* Added a new property `permanentRedirectTo` on route objects.

* Removed the default `<Loading/>` component and the CSS files associated with it.

* Removed deprecated "translation" stuff.

* Removed exports related to `load()` functions: `indicateLoading()`, `showLoadingPage()`, `LOAD_STARTED`, `LOAD_FINISHED`, `LOAD_FAILED`.

* Removed deprecated `rerender` function that was previously returned from `setUpAndRender()` on the client side.

* Removed `store` parameter from `react-pages.js` configuration file.

* Added `onStoreCreated` option that can be passed to `setUpAndRender()` as part of the second `options` argument. One could use this function to get the `store` as soon as it's created.

* The `reducers` parameter in `react-pages.js` configuration file is now optional.

* The `store` is no longer returned from the client-side `render()` function due to not being used.

* Removed `getState` parameter from some functions. Use `useSelector` parameter instead.
  * `Component.load()`
  * `Component.onLoaded()`
  * `settings.onError()`
  * `settings.http.onError()`
  * `settings.http.onRequest()`
  * `settings.http.authentication.accessToken()`
  * `clientSideRenderOptions.onNavigate()`
  * `clientSideRenderOptions.onBeforeNavigate()`

* Changed the arguments of `onNavigate()` function. Previously, it receives 3 arguments: `url`, `location` and `rest`. Now it's a single object: `{ url, location, params, ...rest }`.

* Renamed the `path` parameter of `onError` parameter of `react-pages.js` settings file to `location.pathname`.

* Renamed the `path` parameter of `http.onError` parameter of `react-pages.js` settings file to `location.pathname`.

* Renamed the `container` parameter of `react-pages.js` settings file to `rootComponent`.

* Renamed the `onError` parameter of `react-pages.js` settings file to `onLoadError`.

* The `http.onError` function of `react-pages.js` settings file can now return `true` to prevent the error from being logged to the console as an "Unhandled rejection".

* The `http.onError` function of `react-pages.js` settings file now skips the errors originating from `load()` functions of page components.

<!--
Next.js `redirect` object scheme:

// https://github.com/vercel/next.js/blob/main/packages/next/types/index.d.ts
export type Redirect =
  | {
      statusCode: 301 | 302 | 303 | 307 | 308
      destination: string
      basePath?: false
    }
  | {
      permanent: boolean
      destination: string
      basePath?: false
    }
-->

0.6.53 / 28.04.2023
==================

* Added a new parameter in `.load()` functions: If `getContext()` function was specified in `load` object in `react-pages.js` settings file — `{ ..., load: { getContext: ... } }` — then that `getContext()` function is gonna be available as a `getContext()` parameter in all `.load()` functions.

0.6.36 / 23.04.2023
==================

* Refactored `showLoadingInitially` configuration parameter. It no longer exists. Instead, there're 3 new parameters:

  * `InitialLoadComponent` — A React component that shows an initial page loading indicator.

  * `initialLoadShowDelay: number` — When supplying `InitialLoadComponent`, one should also specify the delay before showing the `InitialLoadComponent`. For example, such delay could be used to only show `InitialLoadComponent` for initial loads that aren't fast enough. For "no delay", the value should be `0`.

  * `initialLoadHideAnimationDuration: number` — When supplying `InitialLoadComponent`, one should also specify the duration of the hide animation of `InitialLoadComponent`, if it has a hide animation. If there's no hide animation, the value should be `0`.

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

	// (optional)
	// `export`ed Redux reducers.
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