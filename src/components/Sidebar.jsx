import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: "📊",
    roles: ["super_admin", "admin", "receptionist", "technician"],
  },
  {
    name: "Tests",
    path: "/tests",
    icon: "🧪",
    roles: ["admin", "receptionist"],
  },
  {
    name: "Patients",
    path: "/patients",
    icon: "🏥",
    roles: ["super_admin", "admin", "receptionist", "technician"],
  },
  {
    name: "Create Invoice",
    path: "/create-invoice",
    icon: "➕",
    roles: ["admin", "receptionist"],
  },
  {
    name: "Invoices",
    path: "/invoices",
    icon: "📋",
    roles: ["super_admin", "admin", "receptionist", "technician"],
  },
  {
    name: "Payments",
    path: "/payments",
    icon: "💳",
    roles: ["super_admin", "admin", "receptionist"],
  },
  {
    name: "Users",
    path: "/users",
    icon: "👥",
    roles: ["super_admin", "admin"],
  },
];

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role;
  const items = NAV.filter((n) => n.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex w-64 flex-col bg-[#F5F0E1] text-gray-800">
      {/* Only Labsy branding — no lab name subtitle */}
      <div className="px-6 py-5 border-b border-[#E0D9C8]">
        <h1 className="text-2xl font-extrabold tracking-tight text-amber-800">
          🔬 Labsy
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-amber-700 text-white shadow-lg shadow-amber-700/30"
                  : "text-gray-600 hover:bg-[#EBE4D1] hover:text-gray-900"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Only logout button — no role indicator */}
      <div className="px-4 py-4 border-t border-[#E0D9C8]">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          <span className="text-lg">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}