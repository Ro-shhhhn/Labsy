import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "🏥",
    title: "Patient Management",
    desc: "Register and manage patients with ease across your entire lab.",
  },
  {
    icon: "🧪",
    title: "Test Catalog",
    desc: "Maintain a custom test catalog with flexible pricing.",
  },
  {
    icon: "📋",
    title: "Smart Invoicing",
    desc: "Create invoices in seconds with automatic total calculation.",
  },
  {
    icon: "👥",
    title: "Multi-User Roles",
    desc: "Admin, Receptionist, Technician — everyone gets the right access.",
  },
  {
    icon: "🏢",
    title: "Multi-Tenant",
    desc: "Each lab is isolated. One platform, many labs.",
  },
  {
    icon: "📊",
    title: "Dashboard Analytics",
    desc: "Real-time stats on patients, tests, and revenue at a glance.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white">
      {/* ─── NAVBAR ─── */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-indigo-400">
          🔬 Labsy
        </h1>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-28">
        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
          Lab Management, Re-imagined
        </span>

        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
          Modern Lab{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Management
          </span>
          <br />
          Made Simple
        </h2>

        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Streamline your entire laboratory workflow — patients, tests,
          invoicing, staff — in one beautiful, multi-tenant platform.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-indigo-600/25"
          >
            Start Free →
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-lg font-semibold backdrop-blur transition-all"
          >
            Login
          </Link>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-7 transition-all"
            >
              <span className="text-4xl">{f.icon}</span>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} Labsy. Built with 💜
      </footer>
    </div>
  );
}