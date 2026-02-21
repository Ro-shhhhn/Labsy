import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useUser';
import { supabase } from '../../lib/supabaseClient';

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Fetch invoices for current lab
  const fetchInvoices = async () => {
    if (!user?.labId) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*, patients(name)')
        .eq('lab_id', user.labId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setInvoices(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user?.labId]);

  // Fetch invoice items and tests when modal opens
  const handleViewDetails = async (invoice) => {
    setSelectedInvoice(invoice);
    setItemsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('invoice_items')
        .select('*, tests(name)')
        .eq('invoice_id', invoice.id);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setInvoiceItems(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setItemsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedInvoice(null);
    setInvoiceItems([]);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <Link
              to="/create-invoice"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Create Invoice
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-gray-600">Loading invoices...</p>
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No invoices found.</p>
              <Link
                to="/create-invoice"
                className="text-blue-600 hover:underline font-medium"
              >
                Create your first invoice
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Invoice ID
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Patient Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Created Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                          {invoice.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {invoice.patients?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ${parseFloat(invoice.total).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleViewDetails(invoice)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Invoice Info */}
                <div className="mb-6 border-b pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Invoice ID</p>
                      <p className="font-mono text-gray-900">{selectedInvoice.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Patient</p>
                      <p className="font-medium text-gray-900">
                        {selectedInvoice.patients?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created Date</p>
                      <p className="text-gray-900">
                        {new Date(selectedInvoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-lg font-bold text-blue-600">
                        ${parseFloat(selectedInvoice.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Tests Included</h3>
                  {itemsLoading ? (
                    <p className="text-gray-600">Loading items...</p>
                  ) : invoiceItems.length === 0 ? (
                    <p className="text-gray-600">No items</p>
                  ) : (
                    <div className="space-y-3">
                      {invoiceItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded"
                        >
                          <span className="text-gray-900">{item.tests?.name}</span>
                          <span className="font-medium text-gray-900">
                            ${parseFloat(item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
