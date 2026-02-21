import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const PAY_COLORS = {
  cash: "bg-emerald-100 text-emerald-700",
  card: "bg-blue-100 text-blue-700",
  upi: "bg-purple-100 text-purple-700",
};

export default function PaymentHistory() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const isSuperAdmin = profile?.role === "super_admin";

  useEffect(() => {
    if (profile) fetchPayments();
  }, [profile]);

  const fetchPayments = async () => {
    let query = supabase
      .from("invoice_payments")
      .select(
        "*, invoices!inner(id, total, lab_id, patient_id, patients(name, phone), labs(name)), users(role)"
      )
      .order("payment_date", { ascending: false });

    if (!isSuperAdmin) {
      query = query.eq("invoices.lab_id", profile.lab_id);
    }

    const { data } = await query;
    setPayments(data || []);
    setLoading(false);
  };

  /* totals */
  const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);

  /* filtered */
  const filtered = payments.filter((p) => {
    // Search by invoice ID or patient name
    if (search) {
      const q = search.toLowerCase();
      const invId = p.invoices?.id?.slice(0, 8)?.toLowerCase() || "";
      const patientName =
        p.invoices?.patients?.name?.toLowerCase() || "";
      if (!invId.includes(q) && !patientName.includes(q)) return false;
    }

    // Date range
    if (dateFrom && p.payment_date < dateFrom) return false;
    if (dateTo && p.payment_date > dateTo + "T23:59:59") return false;

    // Method
    if (methodFilter && p.payment_method !== methodFilter) return false;

    return true;
  });

  const filteredTotal = filtered.reduce((s, p) => s + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payment History</h1>
        <p className="text-gray-500 text-sm mt-1">
          {payments.length} payment{payments.length !== 1 && "s"} — Total: ₹
          {totalAmount.toLocaleString()}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {["cash", "card", "upi"].map((method) => {
          const methodTotal = payments
            .filter((p) => p.payment_method === method)
            .reduce((s, p) => s + Number(p.amount), 0);
          const count = payments.filter(
            (p) => p.payment_method === method
          ).length;
          return (
            <div
              key={method}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    {method} Payments
                  </p>
                  <p className="text-xl font-extrabold text-gray-800 mt-1 font-mono">
                    ₹{methodTotal.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {count} transaction{count !== 1 && "s"}
                  </p>
                </div>
                <span className="text-2xl">
                  {method === "cash" ? "💵" : method === "card" ? "💳" : "📱"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Invoice ID or patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Method
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          {(search || dateFrom || dateTo || methodFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
                setMethodFilter("");
              }}
              className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {(search || dateFrom || dateTo || methodFilter) && (
          <p className="text-xs text-gray-400 mt-2">
            Showing {filtered.length} of {payments.length} payments — Filtered
            Total: ₹{filteredTotal.toLocaleString()}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Patient</th>
                {isSuperAdmin && <th className="px-6 py-4">Lab</th>}
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Recorded By</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400">
                    <span className="text-4xl block mb-2">💳</span>
                    {search || dateFrom || dateTo || methodFilter
                      ? "No payments match your filters."
                      : "No payments recorded yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(p.payment_date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/invoices/${p.invoices?.id}`}
                        className="text-xs font-mono bg-gray-100 text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md font-semibold"
                      >
                        #{p.invoices?.id?.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">
                        {p.invoices?.patients?.name || "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.invoices?.patients?.phone}
                      </p>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                          {p.invoices?.labs?.name || "—"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${
                          PAY_COLORS[p.payment_method] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {p.users?.role?.replace("_", " ") || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-bold text-emerald-600">
                        ₹{Number(p.amount).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}