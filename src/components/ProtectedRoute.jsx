import { useAuth } from '../hooks/useUser';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Only log on actual state changes (reduce noise)
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProtectedRoute]', location.pathname, '| loading:', loading, '| user:', user?.email ?? 'null');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}