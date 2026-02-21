import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useUser';
import { supabase } from '../../lib/supabaseClient';

export default function Tests() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch tests for current lab
  const fetchTests = async () => {
    if (!user?.labId) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('tests')
        .select('*')
        .eq('lab_id', user.labId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setTests(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [user?.labId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.price.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('tests').insert([
        {
          name: formData.name,
          price: parseFloat(formData.price),
          lab_id: user.labId,
        },
      ]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setFormData({ name: '', price: '' });
      await fetchTests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('tests')
        .delete()
        .eq('id', testId)
        .eq('lab_id', user.labId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      await fetchTests();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Lab Tests</h1>

          {/* Add Test Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Test</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddTest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Blood Test"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 50.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Test'}
              </button>
            </form>
          </div>

          {/* Tests List Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tests</h2>

              {loading ? (
                <p className="text-gray-600">Loading tests...</p>
              ) : tests.length === 0 ? (
                <p className="text-gray-600">No tests added yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Price</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map((test) => (
                        <tr key={test.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{test.name}</td>
                          <td className="px-4 py-3 text-gray-900">${parseFloat(test.price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(test.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteTest(test.id)}
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
