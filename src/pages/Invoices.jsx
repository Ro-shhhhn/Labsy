import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../components/Toast";
import { printInvoice, downloadInvoicePDF } from "../lib/printInvoice";

const PAY_COLORS = {
  cash: "bg-emerald-100 text-emerald-700",
  card: "bg-blue-100 text-blue-700",
  upi: "bg-purple-100 text-purple-700",
};

const STATUS_STYLES = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  unpaid: "bg-red-100 text-red-700",
};

export default function Invoices() {
  const { profile } = useAuth();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [paymentSums, setPaymentSums] = useState({});
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = profile?.role === "super_admin";
  const canDelete = profile?.role === "admin";

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  const fetchData = async () => {
    let invQuery = supabase
      .from("invoices")
      .select("*, patients(name, phone), labs(name)")
      .order("created_at", { ascending: false });

    if (!isSuperAdmin) {
      invQuery = invQuery.eq("lab_id", profile.lab_id);
    }

    const { data: invData } = await invQuery;
    setInvoices(invData || []);

    const { data: payments } = await supabase
      .from("invoice_payments")
      .select("invoice_id, amount");

    const sums = {};
    payments?.forEach((p) => {
      sums[p.invoice_id] = (sums[p.invoice_id] || 0) + Number(p.amount);
    });
    setPaymentSums(sums);
    setLoading(false);
  };

  const getStatus = (inv) => {
    const total = Number(inv.total);
    const paid = paymentSums[inv.id] || 0;
    if (paid >= total) return "paid";
    if (paid > 0) return "partial";
    return "unpaid";
  };

  const handlePrint = async (inv) => {
    const { data: items } = await supabase
      .from("invoice_items")
      .select("*, tests(name)")
      .eq("invoice_id", inv.id);
    const { data: payments } = await supabase
      .from("invoice_payments")
      .select("*")
      .eq("invoice_id", inv.id)
      .order("payment_date");
    const labName = inv.labs?.name || profile?.labs?.name || "Laboratory";
    printInvoice(inv, items || [], labName, payments || []);
  };

  const handlePDF = async (inv) => {
    toast.info("Generating PDF...");
    const { data: items } = await supabase
      .from("invoice_items")
      .select("*, tests(name)")
      .eq("invoice_id", inv.id);
    const { data: payments } = await supabase
      .from("invoice_payments")
      .select("*")
      .eq("invoice_id", inv.id)
      .order("payment_date");
    const labName = inv.labs?.name || profile?.labs?.name || "Laboratory";
    await downloadInvoicePDF(inv, items || [], labName, payments || []);
    toast.success("PDF downloaded!");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    await supabase.from("invoice_items").delete().eq("invoice_id", id);
    await supabase.from("invoice_payments").delete().eq("invoice_id", id);
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (!error) {
      toast.success("Invoice deleted!");
      fetchData();
    } else {
      toast.error("Failed: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="-mt-2">
      {/* Tighter header */}
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {invoices.length} invoice{invoices.length !== 1 && "s"}{" "}
          {isSuperAdmin ? "across all labs" : "total"}
        </p>
      </div>

      {/* Table fills remaining height */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 140px)" }}>
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Invoice</th>
                <th className="px-6 py-3">Patient</th>
                {isSuperAdmin && <th className="px-6 py-3">Lab</th>}
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400">
                    <span className="text-4xl block mb-2">📋</span>
                    No invoices yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const status = getStatus(inv);
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="text-xs font-mono bg-gray-100 text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md font-semibold"
                        >
                          #{inv.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold uppercase">
                            {inv.patients?.name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {inv.patients?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {inv.patients?.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-3">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                            {inv.labs?.name || "—"}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-3">
                        {inv.payment_method ? (
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                              PAY_COLORS[inv.payment_method] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {inv.payment_method}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${STATUS_STYLES[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-gray-800 font-mono">
                          ₹{Number(inv.total).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handlePrint(inv)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Print
                          </button>
                          <button
                            onClick={() => handlePDF(inv)}
                            className="px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            PDF
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(inv.id)}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}