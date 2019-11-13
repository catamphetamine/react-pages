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