// C:\Users\itsme\OneDrive\Desktop\Labsy\src\app\page.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useUser';
import { useEffect, useState } from 'react';

export default function Landing() {
  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // Optional: If you want landing page to also logout existing users
  // Remove this useEffect if you want logged-in users to be redirected to dashboard instead
  useEffect(() => {
    const handleExistingSession = async () => {
      if (!loading && user) {
        setLoggingOut(true);
        console.log('[Landing] User logged in, logging out...');
        await logout();
        setLoggingOut(false);
      }
    };

    handleExistingSession();
  }, [user, loading, logout]);

  // Wait for auth to resolve
  if (loading || loggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">
            {loggingOut ? 'Logging out...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          Labsy — Lab Management System
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 mb-12">
          Multi-lab billing and patient management system.
        </p>

        <div className="space-x-4">
          <Link
            to="/login"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="inline-block px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Signup
          </Link>
        </div>
      </div>
    </div>
  );
}