import type { Location, NavigationStack } from 'navigation-stack'

import { createContext } from 'react';

export default createContext<NavigationContext | null>(null);

export interface NavigationContext {
	location: Location;
	navigationStack: NavigationStack;
}