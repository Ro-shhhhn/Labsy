import { useAuthContext } from '../context/AuthContext';

/**
 * Custom hook for accessing authentication
 */
export const useAuth = () => {
  const authContext = useAuthContext();
  return authContext;
};

/**
 * Custom hook for accessing user info
 */
export const useUser = () => {
  const { user, loading } = useAuthContext();
  return { user, loading };
};
