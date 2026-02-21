import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useUser';
import { supabase } from '../../lib/supabaseClient';

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch patients for current lab
  const fetchPatients = async () => {
    if (!user?.labId) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('lab_id', user.labId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setPatients(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user?.labId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('patients').insert([
        {
          name: formData.name,
          phone: formData.phone,
          lab_id: user.labId,
        },
      ]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setFormData({ name: '', phone: '' });
      await fetchPatients();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
        .eq('lab_id', user.labId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      await fetchPatients();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Patients</h1>

          {/* Add Patient Form */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Patient</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 555-0123"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Patient'}
              </button>
            </form>
          </div>

          {/* Patients List Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patients</h2>

              {loading ? (
                <p className="text-gray-600">Loading patients...</p>
              ) : patients.length === 0 ? (
                <p className="text-gray-600">No patients added yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Phone</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map((patient) => (
                        <tr key={patient.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{patient.name}</td>
                          <td className="px-4 py-3 text-gray-600">{patient.phone}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(patient.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeletePatient(patient.id)}
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
