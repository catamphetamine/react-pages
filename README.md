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

Is a module providing support for isomorphic (universal) rendering with React, React-router, Redux, Redux-router. Also allows for Webpack bundler. Allows for locale detection and therefore internationalization of the app. Also it handles Http Cookies mutation correctly (both on client and server).

## Installation

```bash
$ npm install react-isomorphic-render --save
```

## Usage

See [webapp](https://github.com/halt-hammerzeit/webapp) and [webpack-react-redux-isomorphic-render-example](https://github.com/halt-hammerzeit/webpack-react-redux-isomorphic-render-example) as references.

The following usage example is for `React + React-router + Redux` setup.

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

      // (optional)
      styles: { main: '/assets/main.css' },

      // (optional)
      // URL of your "favicon".
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

  // (optional)
  // handles errors on the server side
  // (can redirect to special error pages if needed)
  // on_error: (error, { url, redirect }) => redirect(`/error?url=${encode(url)}&error=${error.code}`)

  // (optional)
  // returns an array of React elements.
  // which will be inserted into server rendered webpage's <head/>
  // (use `key`s to prevent React warning)
  // head: () => [...]

  // (optional)
  // returns a React element.
  // allows for wrapping React page component with arbitrary markup.
  // returns either a React element or an array of React elements
  // which will be inserted into server rendered webpage's <body/>
  // body: react_page_element => react_page_element

  // (optional)
  // returns an array of React elements.
  // allows adding arbitrary React components to the end of the <body/>
  // (use `key`s to prevent React warning)
  // body_end: () => [...]

  // (optional)
  // (is used only in development mode - removes Ctrl + R (F5) flicker)
  // This CSS text will be inserted into server rendered webpage's <head/> <style/> tag.
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

// renders the webpage on the client side
render
({
  // enable/disable development mode (true/false)
  development: _development_,

  // enable/disable Redux development tools (true/false)
  // development_tools: _development_tools_,

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

// your Redux reducers
import reducers from './path/to/reducers'

export default function(options)
{
  // (optional)
  // handles errors occurring inside `@preload()` of pages on the client side
  // (can redirect to special error pages if needed)
  // options.on_preload_error = (error, { url, redirect }) => redirect(`/error?url=${encode(url)}&error=${error.code}`)

  // (optional)
  // user can add his own middleware to the `middleware` list
  // options.middleware = middleware => ...

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
  return (
    <Route path="/" component={Layout}>
      <IndexRoute component={Home}/>
      <Route path="blog"  component={Blog}/>
      <Route path="about" component={About}/>
      <Route path="*"     component={Page_not_found} status={404}/>
    </Route>
  )
}
```

The `markup_wrapper` component would look like this (nothing special about it)

```javascript
// can be also a "React pure component"
export default class Wrapper extends React.Component
{
  static propTypes = 
  {
    store : React.PropTypes.object.isRequired
  }

  // wraps React page component into arbitrary markup (e.g. Redux Provider)
  //
  render()
  {
    return <Provider store={this.props.store} key="provider">{this.props.children}</Provider>
  }
}
```

And, finally, React pages would look like this (use `@preload()` helper to load the neccessary data before the page is rendered)

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
        <ul>{this.props.users.map(user => <li>{user.name}</li>)}</ul>
        <button onClick={this.props.fetch_users}>Refresh</button>
      </div>
    )
  }

  // Observing action result example.
  //
  // Suppose you make a `delete_users()` function 
  // analagous to the `fetch_users()` function.
  //
  // Then you can call it like this:
  //
  // <button onClick={::this.delete_users}>Delete all users</button>
  //
  // (async/await Babel syntax is used here; can be rewritten as usual Promises)
  //
  async delete_users()
  {
    try
    {
      const count = await this.props.delete_users()
      alert(`Deleted ${count} users`)
    }
    catch (error)
    {
      alert(error)
    }
  }
}
```

The final step is to set up the main web server to proxy all Http requests for webpages to the webpage rendering server you've set up.

An example of how Http request routing on your web server can be set up:

 * all Http GET requests starting with `/assets` return static files from your `assets` folder
 * all Http requests starting with `/api` call your REST API methods
 * all the other Http GET requests are proxied to `http://localhost:3000` for webpage rendering

(proxying can be easily set up with [http-proxy](https://github.com/nodejitsu/node-http-proxy))

(see the aforementioned example projects for reference)

## Page preloading

As you have noticed in the (Redux) example above, `@preload()` helper is called to preload a web page before display. It is used to preload pages before rendering them (both on the server side and on the client side). This is a powerful feature.

On the client side, when a user navigates a link, first it changes the Url in the address bar, then it waits for the next page to preload, and when the page is fully loaded it displays the page to the user. If preloading a page can take some time one may want to add a "spinner" to inform the user that the navigation process needs some time. It can be done by adding a Redux reducer listening to these three Redux events:

```javascript
import { Preload_started, Preload_finished, Preload_failed } from 'react-isomorphic-render/redux'

export default function(state = {}, event = {})
{
  switch (event.type)
  {
    case Preload_started  : return { ...state, pending: true,  error: false }
    case Preload_finished : return { ...state, pending: false }
    case Preload_failed   : return { ...state, pending: false, error: event.error }
    default               : return state
  }
}
```

```javascript
import React       from 'react'
import { connect } from 'react-redux'

export default connect(model => ({ pending: model.preload.pending, error: model.preload.error }))
(function Spinner(props)
{
  return <div className={"preloading " + (props.pending ? "preloading-show" : "")}/>
})
```

```css
.preloading
{
  position: fixed;

  top    : 0;
  left   : 0;
  right  : 0;
  bottom : 0;

  z-index: 1;

  background-color: rgba(0, 0, 0, 0.2);

  display: none;
}

.preloading-show
{
  display: block;
  cursor: wait;
}
```

## Utilities

```javascript
import { head, title, meta } from 'react-isomorphic-render'

// sets specific webpage <head/> tags
head
(
  title = 'WebApp',
  description = 'A generic web application boilerplate',
  meta =
  {
    // <meta charset="utf-8" />
    charSet: 'utf-8',

    name:
    {
      // all <meta name="..." content="..."/> tags go here
      viewport: 'width=device-width, initial-scale=1.0, user-scalable=no'
    },

    property:
    {
      // all <meta property="..." content="..."/> tags go here
      'og:site_name': title,
      'og:locale': 'ru_RU',
      'og:title': title,
      'og:description': description,
    }
  }
)

// webpage title will be replaced with this one
title('New webpage title')

// will add additional <meta/> tags to the webpage <head/>
meta({ ... same `meta` as above ... })
```

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