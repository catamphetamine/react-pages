import { getLocationUrl, type NavigationStack, type Location } from 'navigation-stack';

import type { OnBeforeLocationChange } from '../types.d.js';

import isPromise from '../utility/isPromise.js'

export default function onLocationChangeHandler(
  location: Location,
  {
    onBeforeLocationChange,
    getExecutionState,
    setExecutionState,
    setLocation,
    navigationStack,
  }: {
    onBeforeLocationChange?: OnBeforeLocationChange,
    getExecutionState: () => OnLocationChangeHandlerExecutionState | undefined,
    setExecutionState: (executionState: OnLocationChangeHandlerExecutionState) => void,
    setLocation: (location: Location) => void,
    navigationStack: NavigationStack,
  },
) {
  // If there's still a previous location that is being loaded,
  // cancel loading such previous location because it's irrelevant now.
  const prevExecutionState = getExecutionState();
  if (prevExecutionState && prevExecutionState.inProgress) {
    prevExecutionState.cancelled = true;
  }

  const executionState = { inProgress: true, cancelled: false };
  setExecutionState(executionState);

  const onSuccess = () => {
    executionState.inProgress = false;
    setLocation(location);
    if (!executionState.cancelled) {
      navigationStack.locationRendered(location);
    }
  };

  const onError = (error: unknown) => {
    executionState.inProgress = false;
    if (error instanceof RedirectError) {
      navigationStack.replace(error.location);
    } else {
      setLocation(location);
      throw error;
    }
  };

  if (!onBeforeLocationChange) {
    onSuccess();
    return;
  }

  try {
    // Run the `callback()` and call `navigation.locationRendered()` when it finishes.
    // The `callback()` could also call a `redirect()` function which would cause a redirect to another page.
    const result = onBeforeLocationChange(location, {
      redirect: (toLocation) => {
        throw new RedirectError(toLocation);
      },
    });

    if (isPromise(result)) {
      result.then(
        () => {
          onSuccess();
        },
        (error) => {
          onError(error);
        },
      );
    } else {
      onSuccess();
    }
  } catch (error) {
    onError(error);
  }
}

class RedirectError extends Error {
  location: Location

  constructor(location: Location) {
    super(`Redirect to ${getLocationUrl(location)}`);
    this.location = location;
  }
}

export interface OnLocationChangeHandlerExecutionState {
  inProgress: boolean;
  cancelled: boolean;
}