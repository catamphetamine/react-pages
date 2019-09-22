# Migration

## Migration from `react-website@3.x` to `react-pages@1.x`

### Changes

* Update `react-redux` to `>= 7.1`. Updating from `5.x` to `6.x` has only a [single breaking change](https://github.com/reduxjs/react-redux/issues/1104): `withRef` is replaced with `forwardRef`, and therefore any uses of `wrapperComponentInstance.getWrappedInstance()` are replaced with `actualComponentInstance`. Updating from `6.x` to `7.x` [has no breaking changes](https://github.com/reduxjs/react-redux/releases/tag/v7.0.1).
* Update `react` and `react-dom` to `>= 16.8`.
* `@meta()`, `@preload()`, `@onPageLoaded()` decorators are now deprecated because they [can't be used on functional components](https://github.com/tc39/proposal-decorators). Instead, there're now `meta`, `load` and `onLoaded` static properties: `meta` can be an object or a function returning an object; `load` can be a function, an object of shape `{ load, options }`, or an array of those; `onLoaded` can be a function. The `@meta()`, `@preload()` and `@onPageLoaded()` decorators still work, but also have been rewritten as functions setting static properties on a component rather than creating new "wrapper" React components (there shouldn't be any breaking changes).
* Page components no longer receive `params` property in `found@0.4.x` (in case anyone used that property, but I guess no one did).
* For those who used `withRouter()` decorator previously now there's a better alternative — `useRouter()` hook: `const { match, router } = useRouter()`. This library no longer re-exports `found`'s `withRouter` decorator though `found` still does export it.
* Sending `GET` or `multipart/form-data` requests using `http` utility [no longer](https://github.com/catamphetamine/react-website/issues/74) adds `Content-Type` header. This shouldn't be an issue for most users. For cases when reverting to the old behavior is needed, the `Content-Type` header can be set [manually](https://github.com/catamphetamine/react-website/issues/74#issuecomment-496443987) via `http.onRequest(request)` hook:

```js
http: {
  onRequest: (request) => {
    if (!request.header['content-type']) {
      request.set('application/json')
    }
  }
}
```

* Removed `Promise` cancellation and the `cancelPrevious: true` Redux action parameter.

Modify `meta`, `preload`, `onPageLoaded` decorators to add `load`, `meta` and `onLoaded` static properties.

Check that sending forms with files (single, multiple) via `http` works.

Check that the refactored http.request() populateErrorData() works (emulate an error on server side).

Maybe check setting server-side cookies.

Create a `react-website@3.x` branch of `webpack-example-` and add the list to the branch to the 3.x README.

Create `react-pages-basic-example` analogous to `react-website-basic-example`.

### Renames

* Due to the library being renamed from `react-website` to `react-pages` all corresponding global `window` variables have also been renamed from `window._react_website_...` to `window._react_pages_...`. This change shouldn't affect anyone because those global variables aren't documented anywhere and aren't part of the public API.
* For those who used the `<Loading/>` component its CSS class names have been renamed from `.react-website__loading__...` to `.react-pages__loading__...`.
* For those who used `static-site-generator` the `/react-website-base` URL has been renamed to `/react-pages-base`.
* All `@@react-website/...` Redux actions have been renamed to `@@react-pages/...`. Those actions are "preload started", "preload finished" and "preload failed" and they're exported as `PRELOAD_STARTED`, `PRELOAD_FINISHED` and `PRELOAD_FAILED` respectively, so this change shouldn't break anyone's code unless not using those exports for the Redux action names. There're also some "private" ones like `@@react-website/RESOLVE_MATCH` that got renamed but I guess no one would ever have a reason to use those.

### Removed deprecations

* `http.allowAbsoluteURLs` settings has been removed.
* `redux.v2` `v2` -> `v3` migration parameter has been removed.
* `redux.getProperties()` method has been removed.
* `redux.resetError()` method has been removed.

### Non-breaking dependency updates

* Updated `superagent` HTTP library from `2.x` to `5.x`. There shouldn't be any breaking changes.
* Updated Babel from `6` to `7`. No breaking changes.
* Updated `multistream` server-side library from `2.x` to `3.x`. No breaking changes.
* Updated `string-to-stream` server-side library from `1.x` to `2.x`. No breaking changes.
* Updated `cookie` server-side library from `0.3.x` to `0.4.x`. No breaking changes.
* Updated `fs-extra` server-side library from `2.x` to `8.x`. No breaking changes.