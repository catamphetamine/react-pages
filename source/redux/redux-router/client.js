// This is the `reduxReactRouter` middleware:
// import { reduxReactRouter } from 'redux-router'
// applyMiddleware(reduxReactRouter)

import { compose } from 'redux';
import reduxReactRouter from './reduxReactRouter';
import useDefaults from './useDefaults';
import addHistorySynchronization from './addHistorySynchronization';
// import routeReplacement from './routeReplacement';

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
export default function reduxReactRouterMiddleware(options) {
  options = useDefaults(options);
  // return addHistorySynchronization(routeReplacement(reduxReactRouter))(options);
  return addHistorySynchronization(reduxReactRouter)(options);
}
