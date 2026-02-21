import { useAuth } from "../context/AuthContext";

const ROLE_LETTER = {
  admin: "A",
  receptionist: "R",
  technician: "T",
  super_admin: "S",
};

const ROLE_COLOR = {
  admin: "bg-indigo-600",
  receptionist: "bg-emerald-600",
  technician: "bg-amber-600",
  super_admin: "bg-rose-600",
};

export default function Navbar() {
  const { profile } = useAuth();
  const role = profile?.role;
  const letter = ROLE_LETTER[role] || "?";
  const color = ROLE_COLOR[role] || "bg-gray-500";

  return (
    <header className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
      {/* Company name instead of email */}
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-gray-900 truncate">
          {profile?.labs?.name || "Labsy"}
        </h2>
      </div>

      {/* Round profile icon with role letter */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center text-base font-bold shadow`}
          title={role?.replace("_", " ")}
        >
          {letter}
        </div>
      </div>
    </header>
  );
}