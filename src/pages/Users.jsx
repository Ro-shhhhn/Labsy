import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase, supabaseAdmin } from "../lib/supabaseClient";
import RoleGuard from "../components/RoleGuard";
import Modal from "../components/Modal";

function UsersInner() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = profile?.role === "super_admin";
  const isAdmin = profile?.role === "admin";

  /* create modal */
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("receptionist");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* edit modal */
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (profile) fetchUsers();
  }, [profile]);

  const fetchUsers = async () => {
    let query = supabase
      .from("users")
      .select("*, labs(name)")
      .order("created_at", { ascending: false });

    if (!isSuperAdmin) {
      query = query.eq("lab_id", profile.lab_id);
    }

    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const { data: authData, error: authErr } =
        await supabaseAdmin.auth.signUp({ email, password });
      if (authErr) throw authErr;

      const newUserId = authData.user?.id;
      if (!newUserId) throw new Error("User creation failed — no ID returned.");

      const { error: profileErr } = await supabase.from("users").insert({
        id: newUserId,
        lab_id: profile.lab_id,
        role,
      });
      if (profileErr) throw profileErr;

      setEmail("");
      setPassword("");
      setRole("receptionist");
      setSuccess("Staff member added successfully!");
      fetchUsers();

      setTimeout(() => {
        setOpen(false);
        setSuccess("");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (u) => {
    setEditId(u.id);
    setEditRole(u.role);
    setEditOpen(true);
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ role: editRole })
      .eq("id", editId);
    if (!error) {
      setEditOpen(false);
      setEditId(null);
      fetchUsers();
    }
    setEditSaving(false);
  };

  const handleDelete = async (userId) => {
    if (userId === profile.id) {
      alert("You cannot delete yourself.");
      return;
    }
    if (!confirm("Remove this staff member?")) return;
    await supabase.from("users").delete().eq("id", userId);
    fetchUsers();
  };

  const roleColor = (r) => {
    const map = {
      admin: "bg-indigo-100 text-indigo-700",
      receptionist: "bg-emerald-100 text-emerald-700",
      technician: "bg-amber-100 text-amber-700",
      super_admin: "bg-purple-100 text-purple-700",
    };
    return map[r] || "bg-gray-100 text-gray-700";
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
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isSuperAdmin ? "All Users" : "Staff Members"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {users.length} user{users.length !== 1 && "s"}{" "}
            {isSuperAdmin ? "across all labs" : "in your lab"}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setOpen(true);
              setError("");
              setSuccess("");
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25"
          >
            + Add Staff
          </button>
        )}
      </div>

      {/* users grid */}
      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-3">👥</span>
          <p className="font-medium">No users found.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((u) => {
            const isSelf = u.id === profile.id;
            return (
              <div
                key={u.id}
                className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col transition-all ${
                  isSelf
                    ? "border-indigo-200 ring-1 ring-indigo-100"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold uppercase">
                    {u.role?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold capitalize ${roleColor(
                        u.role
                      )}`}
                    >
                      {u.role?.replace("_", " ")}
                    </span>
                    {isSelf && (
                      <span className="ml-2 text-xs text-indigo-500 font-medium">
                        (You)
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  {isSuperAdmin && u.labs?.name && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Lab
                      </p>
                      <p className="text-sm font-medium text-indigo-600">
                        {u.labs.name}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                      User ID
                    </p>
                    <p className="text-sm font-mono text-gray-600 truncate">
                      {u.id.slice(0, 12)}…
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                      Joined
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* actions — only admin of same lab can edit/delete */}
                {isAdmin && !isSelf && (
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => openEditModal(u)}
                      className="flex-1 py-2.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
                    >
                      Edit Role
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="flex-1 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* create modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add Staff Member"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@lab.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="receptionist">Receptionist</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-gray-400 mt-1.5">
              {role === "admin" && "Full access — manage everything."}
              {role === "receptionist" &&
                "Can add patients, create invoices, view tests."}
              {role === "technician" && "View-only access to data."}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {saving ? "Creating…" : "Add Staff"}
            </button>
          </div>
        </form>
      </Modal>

      {/* edit role modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit User Role"
      >
        <form onSubmit={handleEditRole} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              User ID
            </label>
            <p className="text-sm font-mono text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
              {editId?.slice(0, 20)}…
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              New Role
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="receptionist">Receptionist</option>
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {editSaving ? "Updating…" : "Update Role"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function Users() {
  return (
    <RoleGuard roles={["super_admin", "admin"]} redirect>
      <UsersInner />
    </RoleGuard>
  );
}