// eslint-disable-next-line import/no-extraneous-dependencies
import { useContext } from 'react';

import NavigationContext from '../react-components/NavigationContext.js';

export default function useNavigationContext() {
  const navigationContext = useContext(NavigationContext);
  if (!navigationContext) {
    throw new Error('Must be called inside `<WithNavigation/>`');
  }
  return navigationContext;
}
