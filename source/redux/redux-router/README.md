UPDATE: `redux-router` is currently not used in this library, but is kept here just in case

Since `redux-router` maintainers are incompetent and lazy, they don't want to merge my Pull Requests, I'm forking `redux-router` repo here.

The changes made:

 * https://github.com/acdlite/redux-router/pull/282
 * https://github.com/acdlite/redux-router/pull/272
 * `routeReplacement` functionality removed: this way `react-router` won't re-match on saving React components, therefore `@preload()` won't be called every time a developer edits a React component. A theoretical implication of this would be that when editing `./routes.js` the current URL won't re-match, as already said. But editing `routes` is such a seldom activity that one may assume a developer almost never edits `routes`.