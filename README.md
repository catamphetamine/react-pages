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

Is a module providing support for isomorphic (universal) rendering with React, React-router, Redux, Redux-router. Also allows for Webpack bundler.

## Installation

```bash
$ npm install react-isomorphic-render --save
```

## Usage

See [webapp](https://github.com/halt-hammerzeit/webapp) and [webpack-react-redux-isomorphic-render-example](https://github.com/halt-hammerzeit/webpack-react-redux-isomorphic-render-example) as references.

Create your webpage rendering server

```javascript
import webpage_server from 'react-isomorphic-render/page-server'

export default function()
{
  // starts webpage rendering server
  webpage_server
  ({
    // enable/disable development mode (true/false)
    development: _development_,

    // enable/disable Redux development tools (true/false)
    // development_tools: _development_tools_,

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
    assets: () =>
    {
      return {
        javascript: { main: '/assets/main.js' }

        // optional
        styles: { main: '/assets/main.css' }
      }
    },
    
    // wraps React page component into arbitrary markup (e.g. Redux Provider)
    markup_wrapper: (component, {store}) => <Provider store={store} key="provider">{component}</Provider>,

    // a function to create Redux store (explained below)
    create_store,

    // creates React-router routes
    create_routes: store => <Route path="/" component={Layout}>...</Route>,

    // will be inserted into server rendered webpage <head/>
    // (use `key`s to prevent React warning)
    head: () =>
    {
      // clear require() cache for hot reload in development mode
      if (_development_)
      {
        delete require.cache[require.resolve('assets/icon.png')]
      }

      return [
        <link rel="shortcut icon" href={require('assets/icon.png')} key="1"/>
      ]
    },

    // body: optional, extra <body/> content

    // this CSS will be inserted into server rendered webpage <head/> <style/> tag 
    // (when in development mode only - removes rendering flicker)
    styles: () =>
    {
      // clear require() cache for hot reload in development mode
      if (_development_)
      {
        delete require.cache[require.resolve('assets/style.scss')]
      }

      return require('assets/style.scss').toString()
    }
  })
}
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

  // creates React-router routes
  create_routes: store => <Route path="/" component={Layout}>...</Route>,

  // wraps React page component into arbitrary markup (e.g. Redux Provider)
  markup_wrapper: (component, {store}) => <Provider store={store} key="provider">{component}</Provider>
})
```

In the simplest case, `create_store` function would look like this

```javascript
import { create_store } from 'react-isomorphic-render/redux'

import reducers from './path/to/reducers'

export default function(options)
{
  return create_store(reducers, options)
  // Webpack Hot Module Replacement can be added (see example projects for reference)
}
```

Your React pages would look like this

```javascript
import { webpage_title } from 'react-isomorphic-render/webpage head'
import preload from 'react-isomorphic-render/redux/preload'

@preload
(
  function(get_state, dispatch)
  {
    return dispatch(function()
    {
      return {
        promise: http => http.get('/api/users').then(ids => Promise.map(ids, id => http.get(`/api/users/${id}`))),
        events: ['GET_USERS_PENDING', 'GET_USERS_SUCCESS', 'GET_USERS_FAILURE']
      }
    })
  }
)
@connect
(
  store => ({ users: store.users.users }),
  dispatch => bind_action_creators({ some_action }, dispatch)
)
export default class Page extends Component
{
  static propTypes =
  {
    users       : PropTypes.array,
    some_action : PropTypes.func.isRequired
  }

  render()
  {
    return (
      <div>
        <webpage_title("Users")/>
        <ul>{users.map(user => <li>{user.name}</li>)}</ul>
      </div>
    )
  }
}
```

Now go to http://localhost:3000 and you should see your React webpage rendered with navigation working.

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