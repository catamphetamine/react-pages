// The default `index.js` in version `0.3.x` exported the "client"
// render function, but `source/router/client/createRouterElement.js`
// `import`s `found-scroll` that imports `scroll-behavior`
// that imports `page-lifecycle/dist/lifecycle.es5.js`
// that uses `self` that is not defined in Node.js,
// so the default import was un-importable in Node.js.
// So, the "client" rendering function had to be moved to `/client` subpackage.
export { default as render } from '../modules/redux/client/setUpAndRender'