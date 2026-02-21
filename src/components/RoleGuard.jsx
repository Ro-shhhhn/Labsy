import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleGuard({ roles, children, redirect = false }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!profile || !roles.includes(profile.role)) {
    if (redirect) {
      return <Navigate to="/dashboard" replace />;
    }

    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <span className="text-5xl mb-4">🚫</span>
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm mt-1">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  return children;
}