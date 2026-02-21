import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../components/Toast";
import RoleGuard from "../components/RoleGuard";

const PAYMENT_METHODS = [
  { value: "cash", label: "💵 Cash" },
  { value: "card", label: "💳 Card" },
  { value: "upi", label: "📱 UPI" },
];

function CreateInvoiceInner() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTests, setSelectedTests] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [markAsPaid, setMarkAsPaid] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.lab_id) fetchData();
  }, [profile]);

  const fetchData = async () => {
    const [pRes, tRes] = await Promise.all([
      supabase.from("patients").select("*").eq("lab_id", profile.lab_id).order("name"),
      supabase.from("tests").select("*").eq("lab_id", profile.lab_id).order("name"),
    ]);
    setPatients(pRes.data || []);
    setTests(tRes.data || []);
    setLoading(false);
  };

  const toggleTest = (test) => {
    setSelectedTests((prev) => {
      const exists = prev.find((t) => t.id === test.id);
      if (exists) return prev.filter((t) => t.id !== test.id);
      return [...prev, test];
    });
  };

  const total = selectedTests.reduce((s, t) => s + Number(t.price), 0);

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.warning("Select a patient."); return; }
    if (selectedTests.length === 0) { toast.warning("Select at least one test."); return; }
    if (!paymentMethod) { toast.warning("Select a payment method."); return; }

    setSaving(true);
    try {
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          lab_id: profile.lab_id,
          patient_id: selectedPatient,
          total,
          payment_method: paymentMethod,
        })
        .select()
        .single();
      if (invErr) throw invErr;

      const items = selectedTests.map((t) => ({
        invoice_id: invoice.id,
        test_id: t.id,
        price: Number(t.price),
      }));
      const { error: itemErr } = await supabase.from("invoice_items").insert(items);
      if (itemErr) throw itemErr;

      if (markAsPaid) {
        const { error: payErr } = await supabase.from("invoice_payments").insert({
          invoice_id: invoice.id,
          amount: total,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          created_by: profile.id,
        });
        if (payErr) throw payErr;
      }

      toast.success("Invoice created!");
      navigate("/invoices");
    } catch (err) {
      toast.error("Failed: " + err.message);
    } finally {
      setSaving(false);
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
    <div className="w-full max-w-full -mt-2">
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-gray-800">Create Invoice</h1>
        <p className="text-gray-500 text-sm mt-0.5">Select patient, tests, and payment</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-4 w-full">
        {/* Col 1 — Patient + Payment (spans 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Patient */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Patient</label>
            {patients.length === 0 ? (
              <p className="text-sm text-gray-400">No patients found.</p>
            ) : (
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">— Select —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>
                ))}
              </select>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`py-2.5 rounded-lg border-2 text-center text-xs font-bold transition-all ${
                    paymentMethod === pm.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-100 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mark as Paid */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={markAsPaid}
                onChange={(e) => setMarkAsPaid(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-bold text-gray-800">Mark as Paid</p>
                <p className="text-xs text-gray-400">Record full payment now</p>
              </div>
            </label>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Summary</label>

            {selectedTests.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No tests selected.</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {selectedTests.map((t) => (
                  <div key={t.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate pr-2">{t.name}</span>
                    <span className="text-gray-800 font-mono font-medium">₹{Number(t.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-800">Total</span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono">₹{total.toLocaleString()}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving || !selectedPatient || selectedTests.length === 0 || !paymentMethod}
              className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {saving ? "Creating…" : markAsPaid ? "Create & Mark Paid" : "Create Invoice"}
            </button>
          </div>
        </div>

        {/* Col 2 — Tests (spans 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Tests</label>
            <span className="text-xs text-gray-400">{selectedTests.length} selected</span>
          </div>

          {tests.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No tests in catalog.</p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {tests.map((t) => {
                const isSelected = selectedTests.some((st) => st.id === t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTest(t)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 flex-shrink-0"
                      />
                      <span className={`text-sm font-medium truncate ${isSelected ? "text-indigo-700" : "text-gray-700"}`}>
                        {t.name}
                      </span>
                    </div>
                    <span className={`text-sm font-bold font-mono flex-shrink-0 ml-2 ${isSelected ? "text-indigo-600" : "text-gray-400"}`}>
                      ₹{Number(t.price).toLocaleString()}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateInvoice() {
  return (
    <RoleGuard roles={["admin", "receptionist"]} redirect>
      <CreateInvoiceInner />
    </RoleGuard>
  );
}