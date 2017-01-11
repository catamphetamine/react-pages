const defaults = {
  onError: error => { throw error; },
  routerStateSelector: state => state.router
};

export default function useDefaults(options) {
  return {
    ...defaults,
    ...options,
    createHistory: getCreateHistory(options)
  };
}

function getCreateHistory({ createHistory, history }) {
  if (typeof createHistory === 'function') {
    return createHistory;
  }
  if (history) {
    return () => history;
  }
}