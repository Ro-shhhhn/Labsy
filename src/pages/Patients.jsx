import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";

export default function Patients() {
  const { profile } = useAuth();
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const isSuperAdmin = profile?.role === "super_admin";
  const canAdd = ["admin", "receptionist"].includes(profile?.role);
  const canEdit = ["admin", "receptionist"].includes(profile?.role);
  const canDelete = profile?.role === "admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (profile) fetchPatients();
  }, [profile]);

  const fetchPatients = async () => {
    let query = supabase
      .from("patients")
      .select("*, labs(name)")
      .order("created_at", { ascending: false });
    if (!isSuperAdmin) query = query.eq("lab_id", profile.lab_id);
    const { data } = await query;
    setPatients(data || []);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Check duplicate phone in same lab
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("lab_id", profile.lab_id)
      .eq("phone", phone.trim())
      .limit(1);

    if (existing?.length > 0) {
      toast.warning(`A patient with phone ${phone.trim()} already exists.`);
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("patients").insert({
      lab_id: profile.lab_id,
      name: name.trim(),
      phone: phone.trim(),
    });
    if (!error) {
      setName("");
      setPhone("");
      setCreateOpen(false);
      fetchPatients();
      toast.success("Patient registered!");
    } else {
      toast.error("Failed: " + error.message);
    }
    setSaving(false);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditPhone(p.phone || "");
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);

    // Check duplicate phone (exclude self)
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("lab_id", profile.lab_id)
      .eq("phone", editPhone.trim())
      .neq("id", editId)
      .limit(1);

    if (existing?.length > 0) {
      toast.warning(`Another patient with phone ${editPhone.trim()} already exists.`);
      setEditSaving(false);
      return;
    }

    const { error } = await supabase
      .from("patients")
      .update({ name: editName.trim(), phone: editPhone.trim() })
      .eq("id", editId);
    if (!error) {
      setEditOpen(false);
      setEditId(null);
      fetchPatients();
      toast.success("Patient updated!");
    } else {
      toast.error("Failed: " + error.message);
    }
    setEditSaving(false);
  };

  const handleDelete = async (id) => {
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", id);

    if (count > 0) {
      toast.warning(`Cannot delete — ${count} invoice(s) linked. Delete invoices first.`);
      return;
    }

    if (!confirm("Delete this patient?")) return;
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (!error) {
      fetchPatients();
      toast.success("Patient deleted!");
    } else {
      toast.error("Failed: " + error.message);
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-gray-500 text-sm mt-1">
            {patients.length} patient{patients.length !== 1 && "s"}{" "}
            {isSuperAdmin ? "across all labs" : "registered"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-56"
            />
          </div>
          {canAdd && (
            <button onClick={() => setCreateOpen(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 whitespace-nowrap">
              + Add Patient
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Phone</th>
                {isSuperAdmin && <th className="px-6 py-4">Lab</th>}
                <th className="px-6 py-4">Registered</th>
                {(canEdit || canDelete) && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400">
                    <span className="text-4xl block mb-2">🏥</span>
                    {search ? "No patients match." : "No patients yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold uppercase">{p.name?.[0]}</div>
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.phone || "—"}</td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">{p.labs?.name || "—"}</span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    {(canEdit || canDelete) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Edit</button>}
                          {canDelete && <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">Delete</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Register New Patient">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">{saving ? "Saving…" : "Register Patient"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Patient">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
            <input type="tel" required value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={editSaving} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">{editSaving ? "Updating…" : "Update Patient"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}