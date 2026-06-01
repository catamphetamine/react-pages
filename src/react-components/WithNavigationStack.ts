import {
  NavigationStack,
  type ScrollPositionSetterConstructor,
  type EnvironmentConstructor,
  type Location
} from 'navigation-stack';

import {
  createElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import NavigationContext, {
  type NavigationContext as NavigationContextType
} from './NavigationContext.js';

import onLocationChangeHandler, {
  type OnLocationChangeHandlerExecutionState,
  type OnBeforeLocationChange
} from './onLocationChange.js';

export default function WithNavigationStack<ScrollableContainer, ScrollPositionAnchor>({
  environment,
  initialLocation,
  basePath,
  onBeforeLocationChange,
  manageScrollPosition,
  scrollPositionSetter,
  children,
}: Props<ScrollableContainer, ScrollPositionAnchor>) {
  // Contains a `NavigationStack` instance.
  const navigationStackRef = useRef<NavigationStack>(undefined);

  const [location, setLocation] = useState<Location>();

  // Contains "on location change" handler execution state.
  // When location changes, the state becomes `{ cancelled: undefined }`.
  // Then, the new location starts "loading", after which the state becomes `{ cancelled: undefined }`.
  // If the location changes while it's "loading", the state of the previous location
  // (the one that was being loaded) becomes `{ cancelled: true }`.
  const onLocationChangeHandlerExecutionStateRef = useRef<OnLocationChangeHandlerExecutionState>(undefined);

  // Creates and initializes a `NavigationStack` instance on mount.
  useEffect(() => {
    const navigationStack = new NavigationStack(environment, {
      basePath,
      manageScrollPosition,
      scrollPositionSetter,
    });

    navigationStack.subscribe((newLocation) => {
      onLocationChangeHandler(newLocation, {
        onBeforeLocationChange,
        getExecutionState: () => {
          return onLocationChangeHandlerExecutionStateRef.current;
        },
        setExecutionState: (executionState) => {
          onLocationChangeHandlerExecutionStateRef.current = executionState;
        },
        setLocation,
        navigationStack,
      });
    });

    navigationStack.init(initialLocation);

    navigationStackRef.current = navigationStack;

    // Stops `NavigationStack` on unmount.
    return () => {
      if (navigationStackRef.current) {
        navigationStackRef.current.stop();
        navigationStackRef.current = undefined;
      }
    };
  }, []);

  // This variable is only used to check if the `location` value has changed or not.
  const prevLocationRef = useRef<Location>(undefined);
  // When a different `location` has renderd, call `navigationStack.locationRendered()`.
  useLayoutEffect(() => {
    // React calls effects multiple times even when the dependency hasn't changed.
    // For example, it does that in "strict" mode.
    // Because of that, a separate "did change" check is required.
    if (location === prevLocationRef.current) {
      return;
    }
    prevLocationRef.current = location;

    // `location` can't be `undefined` here.
    // This fixes TypeScript complier error.
    if (!location) {
      throw new Error('`location` is `undefined`')
    }

    // This isn't possible because for `setLocation()` to be called,
    // `navigationStack.subscribe()` listener has to be triggered,
    // and that could only happen after `navigationStack` is created.
    if (!navigationStackRef.current) {
      throw new Error(
        'Unexpected location change before `NavigationStack` is created',
      );
    }

    navigationStackRef.current.locationRendered(location);
  }, []);

  // This is the "context" that is available down the React element tree.
  const navigationContextValue = useMemo<NavigationContextTypeBeforeNavigationStackIsInitialized>(() => {
    return {
      navigationStack: navigationStackRef.current,
      location,
    };
  }, [navigationStackRef.current, location]);

  // Until `NavigationStack` has been initialized, don't render anything.
  // Only render anything after `NavigationStack` has been initialized.
  if (isNavigationStackInitialized(navigationContextValue)) {
    // Render React element tree.
    return createElement(
      NavigationContext.Provider,
      { value: navigationContextValue },
      children,
    );
  }

  // `NavigationStack` hasn't been initialized, so don't render anything yet.
  return null;
}

type NavigationContextTypeBeforeNavigationStackIsInitialized =
  Omit<NavigationContextType, 'navigationStack' | 'location'> &
  Partial<Pick<NavigationContextType, 'navigationStack' | 'location'>>

function isNavigationStackInitialized(
  context: NavigationContextTypeBeforeNavigationStackIsInitialized
): context is NavigationContextType {
  return Boolean(context.navigationStack)
}

interface Props<ScrollableContainer, ScrollPositionAnchor> {
  environment: EnvironmentConstructor<ScrollableContainer, ScrollPositionAnchor>;
  initialLocation?: Location;
  basePath?: string;
  onBeforeLocationChange?: OnBeforeLocationChange;
  manageScrollPosition?: boolean;
  scrollPositionSetter?: ScrollPositionSetterConstructor<ScrollableContainer, ScrollPositionAnchor>;
  children: React.ReactNode;
}