import { routerDidChange } from './actionCreators';
import routerStateEquals from './routerStateEquals';

// A function taking `options` and returning a Redux store enhancer
// which detects `react-router` transitions (hyperlink clicks)
// and manual `react-router` navigation (like `dispatch(replace(location))`)
export default function historySynchronization(next) {
  return options => {
    return createStore => (reducer, initialState) => {
      // No middlewares are added to the store
      const store = next(options)(createStore)(reducer, initialState);
      
      const { history, transitionManager } = store;

      let prevRouterState;
      let routerState;

      const {
        onError,
        routerStateSelector
      } = options;

      // On each `react-router` event (e.g. navigation)
      // checks if the URL has actually changed,
      // and if it did, then it dispatches a `ROUTER_DID_CHANGE` Redux event.
      //
      // This `.listen()` call also triggers `react-router` `match()`
      // (which means that `react-router` routes are matched and `onEnter`ed)
      // after which this listener is called, and, therefore, 
      // `ROUTER_DID_CHANGE` is dispatched.
      //
      transitionManager.listen((error, nextRouterState) => {
        if (error) {
          onError(error);
          return;
        }

        // If a navigation event took place,
        // then dispatch a `ROUTER_DID_CHANGE` Redux event.
        if (!routerStateEquals(routerState, nextRouterState)) {
          prevRouterState = routerState;
          routerState = nextRouterState;
          store.dispatch(routerDidChange(nextRouterState));
        }
      });

      // On each Redux state update,
      // if `state.router` was manually changed
      // (e.g. due to a `dispatch(replace(location))` action),
      // then perform the actual URL navigation
      // (including `react-router` transition
      //  which is then gonna be caught in the `transitionManager` listener)
      store.subscribe(() => {
        const nextRouterState = routerStateSelector(store.getState());

        // If `state.router` was manually changed
        if (
          nextRouterState &&
          prevRouterState !== nextRouterState &&
          !routerStateEquals(routerState, nextRouterState)
        ) {
          routerState = nextRouterState;
          const { state, pathname, query } = nextRouterState.location;
          // Then perform the actual URL navigation
          history.replace({state, pathname, query});
        }
      });

      return store;
    };
  }
}