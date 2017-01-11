import { compose, applyMiddleware } from 'redux';
import _reduxReactRouter from './reduxReactRouter';
import useDefaults from './useDefaults';
// import routeReplacement from './routeReplacement';
import matchMiddleware from './matchMiddleware';
import { MATCH } from './constants';

function addMatchingMiddleware(next) {
  return options => createStore => (reducer, initialState) => {
    const store = compose(
      applyMiddleware(
        matchMiddleware((url, callback) => {
          const location = store.history.createLocation(url);
          store.transitionManager.match(location, callback);
        })
      ),
      next(options)
    )(createStore)(reducer, initialState);
    return store;
  };
}

export function match(url, callback) {
  return {
    type: MATCH,
    payload: {
      url,
      callback
    }
  };
}

// Returns a function taking `options`
// and returning a Redux store enhancer
// (which is a composite of 3 store enhancers)
//
// This piece of code is very complex and very advanced.
//
// Redux store enhancers are a very advanced and complex and non-trivial stuff
// https://github.com/reactjs/redux/blob/master/src/applyMiddleware.js
// http://redux.js.org/docs/advanced/Middleware.html
//
export function reduxReactRouter(options) {
  validateOptions(options);
  options = useDefaults(options);
  return addMatchingMiddleware(_reduxReactRouter)(options);
}

function validateOptions(options) {
  if (!options || !(options.routes || options.getRoutes)) {
    throw new Error(
      'When rendering on the server, routes must be passed to the '
    + 'reduxReactRouter() store enhancer; routes as a prop or as children of '
    + '<ReduxRouter> is not supported. To deal with circular dependencies '
    + 'between routes and the store, use the option getRoutes(store).'
    );
  }
  if (!options || !(options.createHistory)) {
    throw new Error(
        'When rendering on the server, createHistory must be passed to the '
        + 'reduxReactRouter() store enhancer'
    );
  }
}