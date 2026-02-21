import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { fetchProfile } = useAuth();
  const [labName, setLabName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      /* 1 — auth user */
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authErr) throw authErr;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Signup failed — no user ID returned.");

      /* 2 — create lab */
      const { data: lab, error: labErr } = await supabase
        .from("labs")
        .insert({ name: labName })
        .select()
        .single();
      if (labErr) throw labErr;

      /* 3 — create user profile */
      const { error: profErr } = await supabase.from("users").insert({
        id: userId,
        lab_id: lab.id,
        role: "admin",
      });
      if (profErr) throw profErr;

      /* 4 — wait for profile to be ready, then navigate */
      if (authData.session) {
        // Force fetch the profile before navigating
        await fetchProfile(userId);
        navigate("/dashboard");
      } else {
        // Email confirmation is enabled
        navigate("/login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 px-4">
      <div className="w-full max-w-md">
        {/* brand */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="text-3xl font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            🔬 Labsy
          </Link>
          <p className="text-slate-500 mt-2 text-sm">
            Create your lab account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-8 space-y-5"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Lab Name
            </label>
            <input
              type="text"
              required
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="City Diagnostics"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lab.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}