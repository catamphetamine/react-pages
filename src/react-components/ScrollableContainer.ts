import type { Location } from 'navigation-stack'

import { createElement, useEffect, useRef } from 'react'

import useNavigationStack from '../react-hooks/useNavigationStack.js'

export default function ScrollableContainer({
  containerKey,
  component,
  shouldChangeScrollPositionOnLocationChange,
  ...rest
}: Props) {
  const navigationStack = useNavigationStack()

  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    return navigationStack.addScrollableContainer(containerKey, ref.current, {
      shouldChangeScrollPositionOnLocationChange,
    });
  }, [containerKey, shouldChangeScrollPositionOnLocationChange]);

  return createElement(component, { ref, ...rest })
}

interface Props {
  containerKey: string;
  component: React.ElementType;
  shouldChangeScrollPositionOnLocationChange?: (prevLocation: Location | undefined, newLocation: Location) => boolean;
}