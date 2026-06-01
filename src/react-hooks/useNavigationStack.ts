import type { NavigationStack } from 'navigation-stack'

import useNavigationContext from './useNavigationContext.js';

export default function useNavigation(): NavigationStack {
  return useNavigationContext().navigationStack;
}
