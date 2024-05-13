// `commonjs/router/client/Router.js`
//   `import` `found-scroll`
//     `import` `scroll-behavior`
//       `import` `page-lifecycle/dist/lifecycle.es5.js` (regardless of CommonJS or ESM)
//          uses `self` variable name which is not defined in Node.js
//          https://unpkg.com/browse/page-lifecycle@0.1.2/dist/lifecycle.es5.js
//
// So exporting `./commonjs/redux/client/setUpAndRender` in the main file
// might break Node.js if it decides to execute it (maybe it won't in ESM mode).
//
// So, the client-side rendering function was moved to a separate `/client` subpackage.
//
exports.render = require('./commonjs/redux/client/setUpAndRender.js').default

// Looks like the `createStore()` function export is deprecated due to being unused.
// exports.createStore = require('./commonjs/redux/client/createStore.js').default