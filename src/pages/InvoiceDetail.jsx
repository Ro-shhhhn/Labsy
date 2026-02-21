import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../components/Toast";
import { printInvoice, downloadInvoicePDF } from "../lib/printInvoice";
import Modal from "../components/Modal";

const PAY_COLORS = {
  cash: "bg-emerald-100 text-emerald-700",
  card: "bg-blue-100 text-blue-700",
  upi: "bg-purple-100 text-purple-700",
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
];

export default function InvoiceDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const toast = useToast();

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  /* add payment modal */
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [paySaving, setPaySaving] = useState(false);

  const canAddPayment = ["super_admin", "admin", "receptionist"].includes(
    profile?.role
  );

  useEffect(() => {
    if (profile && id) fetchAll();
  }, [profile, id]);

  const fetchAll = async () => {
    const [invRes, itemsRes, payRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("*, patients(name, phone), labs(name)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("invoice_items")
        .select("*, tests(name)")
        .eq("invoice_id", id),
      supabase
        .from("invoice_payments")
        .select("*, users(role)")
        .eq("invoice_id", id)
        .order("payment_date", { ascending: false }),
    ]);

    setInvoice(invRes.data);
    setItems(itemsRes.data || []);
    setPayments(payRes.data || []);
    setLoading(false);
  };

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const total = invoice ? Number(invoice.total) : 0;
  const balance = total - totalPaid;

  const statusLabel =
    balance <= 0 ? "Paid" : totalPaid > 0 ? "Partial" : "Unpaid";
  const statusStyle =
    balance <= 0
      ? "bg-emerald-100 text-emerald-700"
      : totalPaid > 0
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.warning("Enter a valid amount greater than 0.");
      return;
    }
    if (amount > balance) {
      toast.warning(
        `Amount exceeds balance due (₹${balance.toLocaleString()}).`
      );
      return;
    }

    setPaySaving(true);
    const { error } = await supabase.from("invoice_payments").insert({
      invoice_id: id,
      amount,
      payment_method: payMethod,
      payment_date: payDate,
      created_by: profile.id,
    });

    if (!error) {
      toast.success("Payment recorded!");
      setPayOpen(false);
      setPayAmount("");
      setPayMethod("cash");
      setPayDate(new Date().toISOString().slice(0, 10));
      fetchAll();
    } else {
      toast.error("Failed: " + error.message);
    }
    setPaySaving(false);
  };

  const handlePrint = () => {
    const labName =
      invoice.labs?.name || profile?.labs?.name || "Laboratory";
    printInvoice(invoice, items, labName, payments);
  };

  const handlePDF = async () => {
    toast.info("Generating PDF...");
    const labName =
      invoice.labs?.name || profile?.labs?.name || "Laboratory";
    await downloadInvoicePDF(invoice, items, labName, payments);
    toast.success("PDF downloaded!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <span className="text-5xl mb-3">📋</span>
        <p className="font-medium">Invoice not found</p>
        <Link
          to="/invoices"
          className="mt-4 text-indigo-600 text-sm font-semibold hover:underline"
        >
          ← Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 no-print">
        <div>
          <Link
            to="/invoices"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2 inline-block"
          >
            ← Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Invoice #{invoice.id.slice(0, 8).toUpperCase()}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            🖨️ Print
          </button>
          <button
            onClick={handlePDF}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Info + Summary */}
      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        {/* Left — Invoice + Patient */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Invoice Info
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Invoice ID</span>
              <span className="text-sm font-mono font-bold text-gray-800">
                #{invoice.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm font-semibold text-gray-800">
                {new Date(invoice.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Payment Method</span>
              {invoice.payment_method ? (
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${
                    PAY_COLORS[invoice.payment_method] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {invoice.payment_method}
                </span>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${statusStyle}`}
              >
                {statusLabel}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3 mt-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Patient
              </p>
              <p className="text-sm font-bold text-gray-800">
                {invoice.patients?.name || "Unknown"}
              </p>
              <p className="text-sm text-gray-500">
                {invoice.patients?.phone || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Right — Financial Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Financial Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-sm font-mono font-semibold text-gray-800">
                ₹
                {items
                  .reduce((s, i) => s + Number(i.price), 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-mono font-extrabold text-gray-900">
                ₹{total.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Paid</span>
                <span className="text-sm font-mono font-semibold text-emerald-600">
                  ₹{totalPaid.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex justify-between bg-gray-50 rounded-xl px-4 py-3 -mx-1">
              <span className="text-sm font-bold text-gray-800">
                Balance Due
              </span>
              <span
                className={`text-lg font-mono font-extrabold ${
                  balance > 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                ₹{balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Test Items
          </h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-6 py-3 w-12">Sl.</th>
              <th className="px-6 py-3">Test Name</th>
              <th className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={item.id}
                className="border-b border-gray-50 hover:bg-gray-50/60"
              >
                <td className="px-6 py-3 text-sm text-gray-400">{i + 1}</td>
                <td className="px-6 py-3 text-sm font-medium text-gray-800">
                  {item.tests?.name || "Unknown Test"}
                </td>
                <td className="px-6 py-3 text-sm font-mono font-semibold text-gray-800 text-right">
                  ₹{Number(item.price).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td />
              <td className="px-6 py-3 text-sm font-bold text-gray-700 text-right">
                Total
              </td>
              <td className="px-6 py-3 text-sm font-mono font-extrabold text-gray-900 text-right">
                ₹{total.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment History — hidden for technician */}
      {canAddPayment && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              Payment History
            </h2>
            {balance > 0 && (
              <button
                onClick={() => setPayOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                + Add Payment
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-3xl block mb-2">💳</span>
              <p className="text-sm">No payments recorded yet.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Recorded By</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 hover:bg-gray-50/60"
                  >
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {new Date(p.payment_date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${
                          PAY_COLORS[p.payment_method] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500 capitalize">
                      {p.users?.role?.replace("_", " ") || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono font-bold text-emerald-600 text-right">
                      ₹{Number(p.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td />
                  <td />
                  <td className="px-6 py-3 text-sm font-bold text-gray-700 text-right">
                    Total Paid
                  </td>
                  <td className="px-6 py-3 text-sm font-mono font-extrabold text-emerald-700 text-right">
                    ₹{totalPaid.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record Payment"
      >
        <form onSubmit={handleAddPayment} className="space-y-4">
          {/* Balance info */}
          <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">Balance Due</span>
            <span className="text-lg font-mono font-extrabold text-red-600">
              ₹{balance.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              required
              min="1"
              max={balance}
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={`Max ₹${balance.toLocaleString()}`}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              required
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPayOpen(false)}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={paySaving}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {paySaving ? "Saving…" : "Record Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}