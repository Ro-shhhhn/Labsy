// C:\Users\itsme\OneDrive\Desktop\Labsy\src\app\dashboard\page.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalTests: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    totalLabs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    if (!user) return;
    if (user.role !== 'super_admin' && !user.labId) {
      console.warn('[Dashboard] labId missing, skipping fetch');
      setLoading(false);
      return;
    }

    console.log('[Dashboard] fetching stats | labId:', user.labId);
    setError('');

    try {
      let newStats;

      if (user.role === 'super_admin') {
        const [labsRes, invoicesRes] = await Promise.all([
          supabase.from('labs').select('id'),
          supabase.from('invoices').select('total'),
        ]);

        if (labsRes.error) throw new Error(labsRes.error.message);
        if (invoicesRes.error) throw new Error(invoicesRes.error.message);

        newStats = {
          totalPatients: 0,
          totalTests: 0,
          totalInvoices: 0,
          totalRevenue: invoicesRes.data.reduce((s, i) => s + parseFloat(i.total || 0), 0),
          totalLabs: labsRes.data.length,
        };
      } else {
        const [patientsRes, testsRes, invoicesRes] = await Promise.all([
          supabase.from('patients').select('id').eq('lab_id', user.labId),
          supabase.from('tests').select('id').eq('lab_id', user.labId),
          supabase.from('invoices').select('id, total').eq('lab_id', user.labId),
        ]);

        if (patientsRes.error) throw new Error(patientsRes.error.message);
        if (testsRes.error) throw new Error(testsRes.error.message);
        if (invoicesRes.error) throw new Error(invoicesRes.error.message);

        newStats = {
          totalPatients: patientsRes.data.length,
          totalTests: testsRes.data.length,
          totalInvoices: invoicesRes.data.length,
          totalRevenue: invoicesRes.data.reduce((s, i) => s + parseFloat(i.total || 0), 0),
          totalLabs: 0,
        };
      }

      setStats(newStats);
      console.log('[Dashboard] ✅ stats loaded');
    } catch (err) {
      console.error('[Dashboard] error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.labId, user?.role]);

  // Fetch fresh stats every time dashboard mounts
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      await fetchStats();
      if (cancelled) return;
    };

    load();
    return () => { cancelled = true; };
  }, [fetchStats]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome{' '}
            {user.role === 'super_admin'
              ? 'Super Admin'
              : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </h1>
          <p className="text-gray-600 mt-2">{user.fullName || user.email}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {user.role !== 'super_admin' && (
                <>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Total Patients</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPatients}</p>
                      </div>
                      <div className="text-blue-600 text-3xl">👥</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Total Tests</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTests}</p>
                      </div>
                      <div className="text-purple-600 text-3xl">🧪</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Total Invoices</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalInvoices}</p>
                      </div>
                      <div className="text-green-600 text-3xl">📄</div>
                    </div>
                  </div>
                </>
              )}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="text-green-600 text-3xl">💰</div>
                </div>
              </div>
              {user.role === 'super_admin' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Labs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLabs}</p>
                    </div>
                    <div className="text-red-600 text-3xl">🏢</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div className="border-b pb-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">User Information</h2>
                  <div className="space-y-2 text-gray-600">
                    <p><span className="font-medium">Email:</span> {user.email}</p>
                    <p><span className="font-medium">Role:</span> <span className="capitalize">{user.role}</span></p>
                    {user.labId && (
                      <p><span className="font-medium">Lab ID:</span> <span className="font-mono text-sm">{user.labId.slice(0, 8)}...</span></p>
                    )}
                  </div>
                </div>
                {user.role === 'admin' && (
                  <div className="border-b pb-4">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Admin Tools</h2>
                    <div className="space-y-2">
                      <a href="/users" className="block text-blue-600 hover:underline font-medium">Manage Staff</a>
                      <a href="/tests" className="block text-blue-600 hover:underline font-medium">Manage Tests</a>
                      <a href="/patients" className="block text-blue-600 hover:underline font-medium">Manage Patients</a>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}