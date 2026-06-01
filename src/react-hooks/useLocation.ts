import useNavigationContext from './useNavigationContext.js';

export default function useLocation() {
  return useNavigationContext().location;
}
