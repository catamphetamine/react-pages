// This file is currently unused.

import { useCallback } from 'react';

import type { DataStorageValue } from 'navigation-stack';

import useNavigationContext from './useNavigationContext.js';
import useNavigationStack from './useNavigationStack.js';

const DATA_STORAGE_KEY_PREFIX = '@@react-navigation-stack/location-state/';

export default function useLocationState<State extends DataStorageValue>() {
  const navigationContext = useNavigationContext();
  const navigationStack = useNavigationStack();

  const get = useCallback(
    (key: string) => {
      return navigationStack.dataStorage.get(
        // Here it must not use `navigationStack.current()` to get the current location.
        // Instead, it should use `navigationContext.location` to get one.
        // The reason is that `navigationContext.location` waits for `onBeforeLocationChange()` function
        // to finish execution while `navigationStack.current()` doesn't.
        // Because `useLocation()` and `useLocationState()` hooks are meant to be synchronized,
        // `useLocationState()` should operate on the same `location` as `useLocation()`,
        // hence the use of a single source for getting the current location.
        navigationContext.location,
        DATA_STORAGE_KEY_PREFIX + key,
      );
    },
    [navigationContext, navigationStack],
  );

  const set = useCallback(
    (key: string, newState: State) => {
      navigationStack.dataStorage.set(
        // Here it must not use `navigationStack.current()` to get the current location.
        // Instead, it should use `navigationContext.location` to get one.
        // The reason is that `navigationContext.location` waits for `onBeforeLocationChange()` function
        // to finish execution while `navigationStack.current()` doesn't.
        // Because `useLocation()` and `useLocationState()` hooks are meant to be synchronized,
        // `useLocationState()` should operate on the same `location` as `useLocation()`,
        // hence the use of a single source for getting the current location.
        navigationContext.location,
        DATA_STORAGE_KEY_PREFIX + key,
        newState,
      );
    },
    [navigationContext, navigationStack],
  );

  // This hook returns `get()`/`set()` functions.
  // It could also be rewritten to mimick the standard `useState()`
  // in terms of returning `[state, setState]` and accepting a `key` as a hook's argument.
  // But that kind of rewrite would imply that the returned `state` is always up-to-date,
  // which would require adding "subscription" mechanism to `navigation-stack`'s "data storage"
  // because `useLocationState()` hook could be called with the same key from different components.
  // In order to not add the currently-unnecessary "subscription" mechanism to `navigation-stack`'s "data storage",
  // this hook simply returns `get()`/`set()` functions. The common usage scenario is
  // to just `get()` the value once as some kind of an `initialValue`, and then `set()` it in case of an unmount.
  return { get, set };
}
