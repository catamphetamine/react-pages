// import StateStorage from '@catamphetamine/farce/StateStorage';
// import StateStorage from '@catamphetamine/farce/lib/esm/StateStorage.js';
// import StateStorage from '@catamphetamine/farce/lib/cjs/StateStorage.js';
import { StateStorage } from '@catamphetamine/farce';
import React, { useRef, useEffect, useMemo, useCallback, createContext } from 'react';
// import ScrollBehavior from 'scroll-behavior';
import ScrollBehavior from '../scroll-behavior/index.js';

const STORAGE_NAMESPACE = '@@scroll';

export const ScrollContext = createContext(null);

const defaultCreateScrollBehavior = config => new ScrollBehavior(config);

// Rewrote `<ScrollManager/>` from `found-scroll` in React hooks.
// Also fixed React strict mode bug.
// https://github.com/4Catalyzer/found-scroll/issues/382
export default function ScrollManager({
  renderArgs,
  shouldUpdateScroll: shouldUpdateScrollProperty,
  createScrollBehavior = defaultCreateScrollBehavior,
  children
}) {
  const { router, location } = renderArgs;

  const prevRenderArgs = useRef(null);
  const scrollBehaviorRef = useRef();

  const scrollBehavior = scrollBehaviorRef.current;

  const getCurrentLocation = useCallback(() => {
    return location;
  }, [location]);

  const getCurrentLocationRef = useRef();
  getCurrentLocationRef.current = getCurrentLocation;

  const shouldUpdateScroll = useCallback((prevRenderArgs, renderArgs) => {
    if (!shouldUpdateScrollProperty) {
      return true;
    }
    // A hack to allow access to `ScrollBehavior` internals (e.g. `stateStorage`).
    return shouldUpdateScrollProperty.call(scrollBehavior, prevRenderArgs, renderArgs);
  }, [scrollBehavior]);

  const registerScrollElement = useCallback((key, element) => {
    scrollBehavior.registerElement(key, element, shouldUpdateScroll, renderArgs);
    return () => {
      scrollBehavior.unregisterElement(key);
    };
  }, [
    shouldUpdateScroll,
    scrollBehavior,
    renderArgs
  ]);

  const scrollContext = useMemo(() => ({
    scrollBehavior,
    registerScrollElement
  }), [
    scrollBehavior,
    registerScrollElement
  ]);

  useEffect(() => {
    const scrollBehavior = createScrollBehavior({
      addNavigationListener: router.addNavigationListener,
      stateStorage: new StateStorage(router, STORAGE_NAMESPACE),
      getCurrentLocation: () => getCurrentLocationRef.current(),
      shouldUpdateScroll: (prevRenderArgs, renderArgs) => shouldUpdateScroll(prevRenderArgs, renderArgs)
    });
    scrollBehaviorRef.current = scrollBehavior;
    return () => {
      scrollBehavior.stop();
    }
  }, []);

  useEffect(() => {
    const scrollBehavior = scrollBehaviorRef.current;
    const prevLocation = prevRenderArgs.current && prevRenderArgs.current.location;

    if (renderArgs.location === prevLocation || !(renderArgs.elements || renderArgs.error)) {
      // If the location hasn't actually changed, or if we're in a global
      // pending state, don't update the scroll position.
      return;
    }

    scrollBehavior.updateScroll(prevRenderArgs.current, renderArgs);
    prevRenderArgs.current = renderArgs;
  });

  // return (
  //   <ScrollContext.Provider value={scrollContext}>
  //     {children}
  //   </ScrollContext.Provider>
  // );

  return React.createElement(ScrollContext.Provider, {
    value: scrollContext
  }, children);
}