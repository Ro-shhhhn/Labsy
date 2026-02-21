import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useUser';
import { supabase } from '../../lib/supabaseClient';
import { Navigate } from 'react-router-dom';

export default function Users() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'technician',
  });
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch staff for current lab
  const fetchStaff = async () => {
    if (!user?.labId) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, role, created_at')
        .eq('lab_id', user.labId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setStaff(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [user?.labId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.email.split('@')[0],
            role: formData.role,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.user) {
        // Step 2: Insert into users table
        const { error: userError } = await supabase.from('users').insert([
          {
            id: data.user.id,
            lab_id: user.labId,
            role: formData.role,
          },
        ]);

        if (userError) {
          throw new Error(`Failed to create staff record: ${userError.message}`);
        }

        setFormData({ email: '', password: '', role: 'technician' });
        await fetchStaff();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      // Delete from users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId)
        .eq('lab_id', user.labId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      await fetchStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Staff Management</h1>

          {/* Add Staff Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Staff</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="staff@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="technician">Technician</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Staff'}
              </button>
            </form>
          </div>

          {/* Staff List Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Members</h2>

              {loading ? (
                <p className="text-gray-600">Loading staff...</p>
              ) : staff.length === 0 ? (
                <p className="text-gray-600">No staff members added yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">User ID</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Added</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((member) => (
                        <tr key={member.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-mono text-xs">
                            {member.id.slice(0, 8)}...
                          </td>
                          <td className="px-4 py-3 text-gray-900 capitalize">{member.role}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(member.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteStaff(member.id)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
