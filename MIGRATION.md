# Migration from `react-website@3.x` to `react-pages@1.x`

## Changes

* Update `react-redux` to `>= 7.1`. Updating from `5.x` to `6.x` has only a [single breaking change](https://github.com/reduxjs/react-redux/issues/1104): `withRef` is replaced with `forwardRef`, and therefore any uses of `wrapperComponentInstance.getWrappedInstance()` are replaced with `actualComponentInstance`. Updating from `6.x` to `7.x` [has no breaking changes](https://github.com/reduxjs/react-redux/releases/tag/v7.0.1).
* Update `react` and `react-dom` to `>= 16.8`.
* Page components no longer receive `params` property in `found@0.4.x` (in case anyone used that property, but I guess no one did).
* For those who used `withRouter()` decorator previously now there's a better alternative — `useRouter()` hook: `const { match, router } = useRouter()`. This library no longer re-exports `found`'s `withRouter` decorator though `found` still does export it.

## Renames

* Due to the library being renamed from `react-website` to `react-pages` all corresponding global `window` variables have also been renamed from `window._react_website_...` to `window._react_pages_...`. This change shouldn't affect anyone because those global variables aren't documented anywhere and aren't part of the public API.
* For those who used the `<Loading/>` component its CSS class names have been renamed from `.react-website__loading__...` to `.react-pages__loading__...`.
* For those who used `static-site-generator` the `/react-website-base` URL has been renamed to `/react-pages-base`.
* All `@@react-website/...` Redux actions have been renamed to `@@react-pages/...`. Those actions are "preload started", "preload finished" and "preload failed" and they're exported as `PRELOAD_STARTED`, `PRELOAD_FINISHED` and `PRELOAD_FAILED` respectively, so this change shouldn't break anyone's code unless not using those exports for the Redux action names. There're also some "private" ones like `@@react-website/RESOLVE_MATCH` that got renamed but I guess no one would ever have a reason to use those.