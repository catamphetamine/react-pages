import { applyMiddleware } from 'redux';
import { useRouterHistory, createRoutes } from 'react-router';
import createTransitionManager from 'react-router/lib/createTransitionManager' ;
import historyMiddleware from './historyMiddleware';
import { ROUTER_STATE_SELECTOR } from './constants';

// A function taking `options` and returning a Redux store enhancer
// which adds `historyMiddleware` and also creates a `history` and a `transitionManager`.
export default function reduxReactRouter({
  routes,
  createHistory,
  parseQueryString,
  stringifyQuery,
  routerStateSelector
}) {
  return createStore => (reducer, initialState) => {
    // `react-router`'s internal `history`
    // is a bit different from the original `history` library.
    const createAppHistory = useRouterHistory(createHistory);

    // Create `history`
    const history = createAppHistory({
      parseQueryString,
      stringifyQuery,
    });

    let store;

    // Create `transitionManager` which is gonna listen
    // for `react-router` navigation events.
    const transitionManager = createTransitionManager(
      history,
      createRoutes(getRoutes(routes, store))
    );

    store =
      applyMiddleware(
        historyMiddleware(history)
      )(createStore)(reducer, initialState);

    store.transitionManager = transitionManager;
    store.history = history;

    // `react-router` state is held in `state.router` property by default
    store[ROUTER_STATE_SELECTOR] = routerStateSelector;

    return store;
  };
}

// Get `react-router` routes
function getRoutes(routes, store) {
  if (!routes) {
    throw new Error('"routes" parameter not passed to redux-router middleware');
  }
  if (typeof routes === 'function') {
    return routes({
      dispatch: action => store.dispatch(action),
      getState: () => store.getState()
    });
  }
  return routes;
}