3.0.0-alpha.2 / 23.08.2018
==================

  * (breaking change) There will likely be some more miscellaneous breaking changes, but the most of the changes have already been made. Marking this version as `alpha` (a milestone) to indicate that something might change.

  * (breaking change) Redux `peerDependency` updated from `3.x` to `4.x`.

  * (breaking change) Replaced `react-router` with `found` under the hood: `<Route/>`s are now imported from `react-website` rather than from `react-router`; `<Route component={...}/>` property is now title-cased: `<Route Component={...}/>`; `<IndexRoute/>` was removed, use a `<Route/>` without a `path` instead; `<IndexLink/>` export has been removed, use `<Link exact/>` instead; `found` reducer has been added so this reducer name must not be pre-occupied by the application; if using `withRouter` then import it from `react-website` rather than from `react-router`.

  * (breaking change) `reduxModule`'s action syntax changed to the "new" one by default (see the README). Therefore setting `redux.v3 = true` flag is no longer needed. For compatibility with the "old" syntax from version `2.x` use `redux.v2 = true` flag. For gradual migration from version `2.x` use the `redux.v3 = true` flag.

  * (breaking change) `static-site-generator`'s `snapshot()` no longer adds the home page (`/`) to the list of pages by default.

  * (breaking change) `websocket` export was moved into its own file: `react-website/websocket`. The reason is that not everyone uses that, so this reduces the resulting application bundle for a tiny bit.

  * (breaking change) for Redux actions having `promise()` property: `promise()` function now receives just the `http` argument instead of `{ http, dispatch, getState }` object. The reason is that `dispatch` and `getState` are unnecessary and aren't used.

  * (breaking chage) `@meta()` decorator now receives just `state` argument instead of on object of shape `{ state, location, parameters }`.

  * (breaking change) `@meta()`'s `locale_other` parameter was renamed to `localeOther`.

  * (breaking change) `@onPageLoaded()` is now only called on client side.

  * (breaking change) `@preload()` and `@onPageLoaded()` now don't receive `history` parameter (there's no more `history` parameter in the whole library).

  * (breaking change) `pushLocation(location, history)` and `replaceLocation(location, history)` now don't take `history` argument and instead shoul be called as `dispatch(pushLocation(location))` and `dispatch(replaceLocation(location))`.

  * (breaking chage) Renamed settings: `error` -> `onError`, `http.error` -> `http.onError`. `onError` handler doesn't receive `dispatch` parameter now (perform redirects using the supplied `redirect` parameter instead).

  * (breaking change) Removed non-camel-case settings, use camel-case ones.

  * (breaking change) Removed non-camel-cased exports (e.g. use `reduxModule` instead of `redux_module`), removed old "action" exports that no one actually used (e.g. `loadState`, `LOAD_STATE`, etc), removed non-uppercase exported constants (e.g. use `PRELOAD_METHOD_NAME` instad of `Preload_method_name` and `PRELOAD_STARTED` instead of `Preload_started`).

  * (breaking change) `loading()` export renamed to `indicateLoading()`.

  * (might be a breaking change) `head`, `bodyStart` and `bodyEnd` now can't return `React.Element`s or arrays of `React.Element`s (previously they were allowed to).

  * (breaking change) Removed server-side configuration parameter `localize()`.

  * (breaking change) Removed client-side configuration parameter `translation()`.

  * (breaking change) `...Pending` and `...Error` state properties are now being cleared rather than being set to `false`/`null`/`undefined`.

  * (breaking change) `history` settings removed from configuration. Only `history.options.basename` is left and is now called simply `basename`.

  * (breaking change) `hollow: true` flag was renamed to `renderContent: false`.

  * `reduxModule`'s `getProperties` is considered deprecated and will be removed in some future major version.

2.0.5 / 06.02.2018
==================

  * Fixed `@preload()`'s `blockingSibling` not being `true` by default.

2.0.4 / 05.02.2018
==================

  * Fixed `@preload()`s not being `blocking: true` by default.

2.0.3 / 26.01.2018
==================

  * Removed deprecated underscored configuration option names: `body_start`, `body_end`.
  * Removed the unused `beforeRender()` server-side configuration parameter. Can be added back upon request.
  * Server-side `render()` function: it now takes 4 arguments instead of 2. And the object being returned also changed. See README-ADVANCED for more info.
  * Now also exporting `renderError(error, options)` which can be used in pair with the exported `render()` server-side function. See README-ADVANCED for more info.

2.0.0 / 28.12.2017
==================

  * (could possibly be a breaking change for someone, but that's unlikely) Asynchronous middleware `action.result` property of "success" action renamed to `action.value`.

  * (breaking change) `result` parameter of Redux module has been moved from `options` argument to an argument itself. Migration guide: `reduxModule.action(event, action, { result })` -> `reduxModule.action(event, action, result, options = {})`.

  * (breaking change) Redux module synchronous actions' `result` is now `(state, result) => ...` instead of `(state, action) => ...` where `result` is what's being returned from `action`.

  * Synchronous action `payload()` parameter of Redux module has been renamed to `action()` along with passing `sync: true` flag: `reduxModule.action(event, { payload, result })` -> `reduxModule.action(event, action, result, { sync: true })`. The old name still works but is deprecated.

1.0.0 / 19.12.2017
==================

  * (breaking change) Renamed `react-isomorphic-render` to `react-website` since the project outgrew its initial name and it's now more about building a React application rather than just isomorphic React rendering.
  * (breaking change) Dropped old React support, now supports React >= 16 only.
  * (breaking change) Removed `koa` entirely (for simplicity).
  * (breaking change) Added `secure` flag to page rendering service options for HTTPS.
  * (breaking change) `wrapper` parameter renamed to `container`.
  * (breaking change) `preload` reducer is now added by default and "preload" reducer name is now reserved for it. `<Loading/>` component is also now built-in into the library and can be `import`ed from it.
  * (breaking change) Removed `request` from rendering service `initialize()` parameters (may be added back, upon request).
  * (breaking change) Removed `loading` from rendering service parameters (seems that it was never used).
  * (breaking change) `render: false` parameter renamed to `hollow: true`.
  * `reduxEventNaming` and `reduxPropertyNaming` are now set by default.
  * (breaking change) `@preload()` now doesn't automatically convert `Array`s into `Promise.all(array)`.
  * (breaking change) `@preload()` `helpers` removed (may be added back upon request).
  * (breaking change) Removed `{ preload: { client } }` configuration parameter.
