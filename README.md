# react-isomorphic-render

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

<!---
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
-->

<!---
[![Gratipay][gratipay-image]][gratipay-url]
-->

Is a module providing support for isomorphic (universal) rendering with React, React-router, Redux, Redux-router. Also allows for Webpack bundler. Allows for locale detection and therefore internationalization of the app.

## Installation

```bash
$ npm install react-isomorphic-render --save
```

## Usage

See [webapp](https://github.com/halt-hammerzeit/webapp) and [webpack-react-redux-isomorphic-render-example](https://github.com/halt-hammerzeit/webpack-react-redux-isomorphic-render-example) as references.

Create your webpage rendering server

```javascript
import webpage_server from 'react-isomorphic-render/page-server'

// starts webpage rendering server
webpage_server
({
  // enable/disable development mode (true/false)
  development: _development_,

  // on which Http host and port to start the webpage rendering server
  // host: optional
  port: 3000,

  // Http host and port for executing all client-side ajax requests on server-side
  web_server:
  {
    host: '192.168.0.1',
    port: 80
  },

  // Http Urls to javascripts and (optionally) CSS styles 
  // which will be insterted into the <head/> element of the resulting Html webpage
  // (as <script src="..."/> and <link rel="style" href="..."/> respectively)
  //
  // Also a website "favicon", if any.
  //
  assets: () =>
  {
    return {
      javascript: { main: '/assets/main.js' },

      // optional
      styles: { main: '/assets/main.css' },

      // URL of your "favicon" (optional).
      // If you're using Webpack then the URL is the result of a require() call.
      icon: require('../assets/icon.png')
    }
  },

  // a function to create Redux store (explained below)
  create_store,

  // creates React-router routes (explained below)
  create_routes,
  
  // wraps React page component into arbitrary markup (explained below)
  markup_wrapper,

  // will be inserted into server rendered webpage <head/>
  // (use `key`s to prevent React warning)
  // (optional)
  // head: () => [...]

  // extra <body/> content
  // (optional)
  // body: () => ...

  // (is used only in development mode - removes client-side rendering flicker)
  // This CSS text will be inserted into server rendered webpage <head/> <style/> tag.
  // If you're using Webpack then the CSS text is the result of a require() call.
  style: () => require('../assets/style.scss').toString()
})
```

And also write your client-side rendering code

```javascript
import { render }     from 'react-isomorphic-render/redux'

import markup_wrapper from './markup wrapper'
import create_store   from './redux/store'
import create_routes  from './routes'

// styles need to be included on the client side
require.include('../../assets/styles/style.scss')

// renders the webpage on the client side
render
({
  // enable/disable development mode (true/false)
  development: _development_,

  // enable/disable Redux development tools (true/false)
  // development_tools: _development_tools_,

  // the DOM element where React markup will be rendered
  to: document.getElementById('react_markup'),

  // a function to create Redux store (explained below)
  create_store,

  // creates React-router routes (explained below)
  create_routes,
  
  // wraps React page component into arbitrary markup (explained below)
  markup_wrapper
})
```

In the simplest case the `create_store` function would look like this

```javascript
import { create_store } from 'react-isomorphic-render/redux'

import reducers from './path/to/reducers'

export default function(options)
{
  return create_store(reducers, options)
  // Webpack Hot Module Replacement can be added (see example projects for reference)
}
```

The `create_routes` function would look like this (nothing special about it)

```javascript
export default function(store)
{
  // `store` can be used in `onEnter` hooks of `Route`s.
  // For example, to implement user authorization.
  //
  <Route path="/" component={Layout}>
    <IndexRoute component={Home}/>
    <Route path="blog" component={Blog}/>
    <Route path="about" component={About}/>
  </Route>
}
```

The `markup_wrapper` function would look like this (nothing special about it)

```javascript
export default function(component, {store})
{
  // wraps React page component into arbitrary markup (e.g. Redux Provider)
  return <Provider store={store} key="provider">{component}</Provider>
}
```

And React pages would look like this

```javascript
import { title }              from 'react-isomorphic-render'
import { preload }            from 'react-isomorphic-render/redux'
import { connect }            from 'react-redux'
import { bindActionCreators } from 'redux'

// fetches the list of users from the server
function fetch_users()
{
  return {
    promise: http => http.get('/api/users').then(ids => Promise.map(ids, id => http.get(`/api/users/${id}`))),
    events: ['GET_USERS_PENDING', 'GET_USERS_SUCCESS', 'GET_USERS_FAILURE']
  }
}

@preload(dispatch => dispatch(fetch_users))
@connect
(
  store    => ({ users: store.users.users }),
  dispatch => bindActionCreators({ fetch_users }, dispatch)
)
export default class Page extends Component
{
  static propTypes =
  {
    users       : PropTypes.array.isRequired,
    fetch_users : PropTypes.func.isRequired
  }

  render()
  {
    return (
      <div>
        <title("Users")/>
        <ul>{users.map(user => <li>{user.name}</li>)}</ul>
        <button onClick={this.props.fetch_users}>Refresh</button>
      </div>
    )
  }
}
```

The final step is to set up the main web server like this

 * For example, all Http GET requests starting with `/assets` return static files
 * For example, all Http GET requests starting with `/api` call REST API methods
 * All the other Http GET requests are proxied to `http://localhost:3000` for webpage rendering

(see the aforementioned example projects for reference)

## Gotchas

This library is build system agnostic: you can use your favourite Grunt, Gulp, Browserify, RequireJS, Webpack, etc.

If you're using Webpack though either make sure your React components don't contain asset `require()` calls (images, styles, fonts, etc) or make those asset `require()` calls work on Node.js with the use of either [webpack-isomorphic-tools](https://github.com/halt-hammerzeit/webpack-isomorphic-tools) or a separate `target: "node"` Webpack build. Yes, Webpack is that stubborn when making it work on the server.

## Suggestions

This library is (semi)open to suggestions on adding new functionality, removing existing functionality, refactoring, etc. This whole thing is evolving fast, things change rapidly.

## Contributing

After cloning this repo, ensure dependencies are installed by running:

```sh
npm install
```

This module is written in ES6 and uses [Babel](http://babeljs.io/) for ES5
transpilation. Widely consumable JavaScript can be produced by running:

```sh
npm run build
```

Once `npm run build` has run, you may `import` or `require()` directly from
node.

After developing, the full test suite can be evaluated by running:

```sh
npm test
```

While actively developing, one can use (personally I don't use it)

```sh
npm run watch
```

in a terminal. This will watch the file system and run tests automatically 
whenever you save a js file.

When you're ready to test your new functionality on a real project, you can run

```sh
npm pack
```

It will `build`, `test` and then create a `.tgz` archive which you can then install in your project folder

```sh
npm install [module name with version].tar.gz
```

## License

[MIT](LICENSE)
[npm-image]: https://img.shields.io/npm/v/react-isomorphic-render.svg
[npm-url]: https://npmjs.org/package/react-isomorphic-render
[downloads-image]: https://img.shields.io/npm/dm/react-isomorphic-render.svg
[downloads-url]: https://npmjs.org/package/react-isomorphic-render

<!---
[travis-image]: https://img.shields.io/travis/halt-hammerzeit/react-isomorphic-render/master.svg
[travis-url]: https://travis-ci.org/halt-hammerzeit/react-isomorphic-render
[coveralls-image]: https://img.shields.io/coveralls/halt-hammerzeit/react-isomorphic-render/master.svg
[coveralls-url]: https://coveralls.io/r/halt-hammerzeit/react-isomorphic-render?branch=master
-->

<!---
[gratipay-image]: https://img.shields.io/gratipay/dougwilson.svg
[gratipay-url]: https://gratipay.com/dougwilson/
-->