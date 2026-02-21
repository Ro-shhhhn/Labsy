import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useUser';
import { supabase } from '../../lib/supabaseClient';

export default function CreateInvoice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch patients and tests
  const fetchData = async () => {
    if (!user?.labId) return;

    setLoading(true);
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('lab_id', user.labId)
        .order('name');

      if (patientsError) throw new Error(patientsError.message);

      // Fetch tests
      const { data: testsData, error: testsError } = await supabase
        .from('tests')
        .select('*')
        .eq('lab_id', user.labId)
        .order('name');

      if (testsError) throw new Error(testsError.message);

      setPatients(patientsData || []);
      setTests(testsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.labId]);

  // Calculate total when tests change
  useEffect(() => {
    const newTotal = selectedTests.reduce((sum, testId) => {
      const test = tests.find((t) => t.id === testId);
      return sum + (test?.price || 0);
    }, 0);
    setTotal(newTotal);
  }, [selectedTests, tests]);

  const handleTestToggle = (testId) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    if (selectedTests.length === 0) {
      setError('Please select at least one test');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Insert into invoices table
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            lab_id: user.labId,
            patient_id: selectedPatient,
            total: total,
          },
        ])
        .select();

      if (invoiceError) {
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }

      const invoiceId = invoiceData[0].id;

      // Step 2: Insert invoice items
      const invoiceItems = selectedTests.map((testId) => {
        const test = tests.find((t) => t.id === testId);
        return {
          invoice_id: invoiceId,
          test_id: testId,
          price: test.price,
        };
      });

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        throw new Error(`Failed to create invoice items: ${itemsError.message}`);
      }

      // Success - redirect to invoices
      navigate('/invoices');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Invoice</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-8">
            <form onSubmit={handleCreateInvoice} className="space-y-8">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Choose a patient --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} ({patient.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tests Multi-Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Tests
                </label>
                <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {tests.length === 0 ? (
                    <p className="text-gray-500">No tests available</p>
                  ) : (
                    tests.map((test) => (
                      <label
                        key={test.id}
                        className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTests.includes(test.id)}
                          onChange={() => handleTestToggle(test.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 flex-1 text-gray-900">{test.name}</span>
                        <span className="text-gray-600 font-medium">
                          ${parseFloat(test.price).toFixed(2)}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Selected Tests Summary */}
              {selectedTests.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Selected Tests ({selectedTests.length})
                  </h3>
                  <ul className="space-y-2">
                    {selectedTests.map((testId) => {
                      const test = tests.find((t) => t.id === testId);
                      return (
                        <li
                          key={testId}
                          className="flex justify-between text-sm text-gray-700"
                        >
                          <span>{test?.name}</span>
                          <span>${parseFloat(test?.price).toFixed(2)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !selectedPatient || selectedTests.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Invoice...' : 'Create Invoice'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
