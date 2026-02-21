import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";

export default function Tests() {
  const { profile } = useAuth();
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (profile?.lab_id) fetchTests();
  }, [profile]);

  const fetchTests = async () => {
    const { data } = await supabase
      .from("tests")
      .select("*")
      .eq("lab_id", profile.lab_id)
      .order("created_at", { ascending: false });
    setTests(data || []);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Check duplicate
    const { data: existing } = await supabase
      .from("tests")
      .select("id")
      .eq("lab_id", profile.lab_id)
      .ilike("name", name.trim())
      .limit(1);

    if (existing?.length > 0) {
      toast.warning(`Test "${name.trim()}" already exists in your catalog.`);
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("tests").insert({
      lab_id: profile.lab_id,
      name: name.trim(),
      price: parseFloat(price),
    });
    if (!error) {
      setName("");
      setPrice("");
      setCreateOpen(false);
      fetchTests();
      toast.success("Test added!");
    } else {
      toast.error("Failed: " + error.message);
    }
    setSaving(false);
  };

  const openEdit = (test) => {
    setEditId(test.id);
    setEditName(test.name);
    setEditPrice(String(test.price));
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);

    // Check duplicate (exclude self)
    const { data: existing } = await supabase
      .from("tests")
      .select("id")
      .eq("lab_id", profile.lab_id)
      .ilike("name", editName.trim())
      .neq("id", editId)
      .limit(1);

    if (existing?.length > 0) {
      toast.warning(`Test "${editName.trim()}" already exists.`);
      setEditSaving(false);
      return;
    }

    const { error } = await supabase
      .from("tests")
      .update({ name: editName.trim(), price: parseFloat(editPrice) })
      .eq("id", editId);
    if (!error) {
      setEditOpen(false);
      setEditId(null);
      fetchTests();
      toast.success("Test updated!");
    } else {
      toast.error("Failed: " + error.message);
    }
    setEditSaving(false);
  };

  const handleDelete = async (id) => {
    const { count } = await supabase
      .from("invoice_items")
      .select("*", { count: "exact", head: true })
      .eq("test_id", id);

    if (count > 0) {
      toast.warning(
        `Cannot delete — used in ${count} invoice(s). Remove from invoices first.`
      );
      return;
    }

    if (!confirm("Delete this test?")) return;
    const { error } = await supabase.from("tests").delete().eq("id", id);
    if (!error) {
      fetchTests();
      toast.success("Test deleted!");
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Test Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">
            {tests.length} test{tests.length !== 1 && "s"} available
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25"
          >
            + Add Test
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-6 py-4">Test Name</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Date Added</th>
              {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="text-center py-16 text-gray-400">
                  <span className="text-4xl block mb-2">🧪</span>
                  No tests yet.
                </td>
              </tr>
            ) : (
              tests.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-sm">🧪</div>
                      <span className="font-medium text-gray-800">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-emerald-600">₹{Number(t.price).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(t)} className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Edit</button>
                        <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New Test">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Test Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Complete Blood Count" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
            <input type="number" required min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">{saving ? "Saving…" : "Add Test"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Test">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Test Name</label>
            <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
            <input type="number" required min="0" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={editSaving} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">{editSaving ? "Updating…" : "Update Test"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}