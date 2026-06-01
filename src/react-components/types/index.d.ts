import type * as React from 'react'

import type { WithComponentProperty } from './as.d.js'

import type {
  Constructor,
  Environment,
  InputLocation,
  NavigationStackOptions,
} from 'navigation-stack'

import type { OnBeforeLocationChange } from '../../types.d.js'

type WithNavigationStackComponentType = <ScrollableContainer, Anchor>(
  props: WithNavigationStackProps<ScrollableContainer, Anchor>,
) => React.ReactNode

export const WithNavigationStack: WithNavigationStackComponentType

interface WithNavigationStackProps<ScrollableContainer, Anchor>
  extends NavigationStackOptions<ScrollableContainer, Anchor> {
  environment: Constructor<Environment<ScrollableContainer, Anchor>>;
  initialLocation?: InputLocation;
  onBeforeLocationChange?: OnBeforeLocationChange;
  children?: React.ReactNode
}

type ScrollableContainerComponentType = <Component extends React.ElementType>(
  props: ScrollableContainerProps<Component>,
) => React.ReactNode

export const ScrollableContainer: ScrollableContainerComponentType

type ScrollableContainerProps<
  Component extends React.ElementType
> = WithComponentProperty<
	Component,
	ScrollableContainerPropsWithoutComponentProperty
>

interface ScrollableContainerPropsWithoutComponentProperty {
  scrollableContainerKey: string;
}