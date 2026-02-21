import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({});
  const [labs, setLabs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartView, setChartView] = useState("daily");
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = profile?.role === "super_admin";

  useEffect(() => {
    if (profile) fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).toISOString();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

      if (isSuperAdmin) {
        const [labsRes, allInvoices, patientsRes, usersRes] = await Promise.all(
          [
            supabase
              .from("labs")
              .select("*")
              .order("created_at", { ascending: false }),
            supabase.from("invoices").select("total, created_at"),
            supabase
              .from("patients")
              .select("*", { count: "exact", head: true }),
            supabase
              .from("users")
              .select("*", { count: "exact", head: true }),
          ]
        );

        const invoices = allInvoices.data || [];
        const todayRevenue = invoices
          .filter((i) => i.created_at >= todayStart)
          .reduce((s, i) => s + Number(i.total), 0);
        const monthRevenue = invoices
          .filter((i) => i.created_at >= monthStart)
          .reduce((s, i) => s + Number(i.total), 0);
        const totalRevenue = invoices.reduce(
          (s, i) => s + Number(i.total),
          0
        );

        setLabs(labsRes.data || []);
        setStats({
          totalLabs: labsRes.data?.length || 0,
          totalUsers: usersRes.count || 0,
          totalPatients: patientsRes.count || 0,
          todayRevenue,
          monthRevenue,
          totalRevenue,
        });

        buildChartData(invoices, yearStart);
      } else {
        const labId = profile.lab_id;

        const [
          patients,
          todayPatients,
          tests,
          invoicesCount,
          allInvoices,
        ] = await Promise.all([
          supabase
            .from("patients")
            .select("*", { count: "exact", head: true })
            .eq("lab_id", labId),
          supabase
            .from("patients")
            .select("*", { count: "exact", head: true })
            .eq("lab_id", labId)
            .gte("created_at", todayStart),
          supabase
            .from("tests")
            .select("*", { count: "exact", head: true })
            .eq("lab_id", labId),
          supabase
            .from("invoices")
            .select("*", { count: "exact", head: true })
            .eq("lab_id", labId),
          supabase
            .from("invoices")
            .select("total, created_at")
            .eq("lab_id", labId),
        ]);

        const invoices = allInvoices.data || [];
        const todayRevenue = invoices
          .filter((i) => i.created_at >= todayStart)
          .reduce((s, i) => s + Number(i.total), 0);
        const monthRevenue = invoices
          .filter((i) => i.created_at >= monthStart)
          .reduce((s, i) => s + Number(i.total), 0);
        const totalRevenue = invoices.reduce(
          (s, i) => s + Number(i.total),
          0
        );

        setStats({
          totalPatients: patients.count || 0,
          patientsToday: todayPatients.count || 0,
          totalTests: tests.count || 0,
          totalInvoices: invoicesCount.count || 0,
          todayRevenue,
          monthRevenue,
          totalRevenue,
        });

        buildChartData(invoices, yearStart);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buildChartData = (invoices, yearStart) => {
    const now = new Date();

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${String(d).padStart(2, "0")}`;
      dailyMap[key] = 0;
    }
    invoices.forEach((inv) => {
      const invDate = new Date(inv.created_at);
      if (
        invDate.getMonth() === now.getMonth() &&
        invDate.getFullYear() === now.getFullYear()
      ) {
        const day = String(invDate.getDate()).padStart(2, "0");
        dailyMap[day] = (dailyMap[day] || 0) + Number(inv.total);
      }
    });

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyMap = {};
    monthNames.forEach((m) => (monthlyMap[m] = 0));
    invoices.forEach((inv) => {
      const invDate = new Date(inv.created_at);
      if (invDate.getFullYear() === now.getFullYear()) {
        const month = monthNames[invDate.getMonth()];
        monthlyMap[month] = (monthlyMap[month] || 0) + Number(inv.total);
      }
    });

    setChartData({
      daily: Object.entries(dailyMap).map(([day, revenue]) => ({
        name: day,
        revenue,
      })),
      monthly: Object.entries(monthlyMap).map(([month, revenue]) => ({
        name: month,
        revenue,
      })),
    });
  };

  const handleDeleteLab = async (labId) => {
    if (!confirm("Delete this lab and ALL its data? This cannot be undone!"))
      return;

    const { data: invoices } = await supabase
      .from("invoices")
      .select("id")
      .eq("lab_id", labId);

    if (invoices?.length) {
      const invoiceIds = invoices.map((i) => i.id);
      await supabase
        .from("invoice_items")
        .delete()
        .in("invoice_id", invoiceIds);
    }

    await supabase.from("invoices").delete().eq("lab_id", labId);
    await supabase.from("patients").delete().eq("lab_id", labId);
    await supabase.from("tests").delete().eq("lab_id", labId);
    await supabase.from("users").delete().eq("lab_id", labId);
    await supabase.from("labs").delete().eq("id", labId);

    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const revenueCards = [
    {
      label: "Today Revenue",
      value: `₹${stats.todayRevenue?.toLocaleString("en-IN")}`,
      icon: "💰",
      bg: "bg-[#f0fdf4]",
      border: "border-[#bbf7d0]",
      textColor: "text-[#166534]",
      subText: "text-[#4ade80]",
      iconBg: "bg-[#dcfce7]",
    },
    {
      label: "This Month",
      value: `₹${stats.monthRevenue?.toLocaleString("en-IN")}`,
      icon: "📅",
      bg: "bg-[#eff6ff]",
      border: "border-[#bfdbfe]",
      textColor: "text-[#1e40af]",
      subText: "text-[#60a5fa]",
      iconBg: "bg-[#dbeafe]",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue?.toLocaleString("en-IN")}`,
      icon: "🏦",
      bg: "bg-[#faf5ff]",
      border: "border-[#e9d5ff]",
      textColor: "text-[#6b21a8]",
      subText: "text-[#a78bfa]",
      iconBg: "bg-[#f3e8ff]",
    },
  ];

  const superInfoCards = [
    {
      label: "Total Labs",
      value: stats.totalLabs,
      icon: "🏢",
      iconBg: "bg-indigo-50",
      iconBorder: "border-indigo-100",
      accent: "text-indigo-600",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: "👥",
      iconBg: "bg-sky-50",
      iconBorder: "border-sky-100",
      accent: "text-sky-600",
    },
    {
      label: "Total Patients",
      value: stats.totalPatients,
      icon: "🏥",
      iconBg: "bg-amber-50",
      iconBorder: "border-amber-100",
      accent: "text-amber-600",
    },
  ];

  const labInfoCards = [
    {
      label: "Patients Today",
      value: stats.patientsToday,
      icon: "🆕",
      iconBg: "bg-rose-50",
      iconBorder: "border-rose-100",
      accent: "text-rose-600",
    },
    {
      label: "Total Patients",
      value: stats.totalPatients,
      icon: "🏥",
      iconBg: "bg-indigo-50",
      iconBorder: "border-indigo-100",
      accent: "text-indigo-600",
    },
    {
      label: "Total Tests",
      value: stats.totalTests,
      icon: "🧪",
      iconBg: "bg-teal-50",
      iconBorder: "border-teal-100",
      accent: "text-teal-600",
    },
    {
      label: "Total Invoices",
      value: stats.totalInvoices,
      icon: "📋",
      iconBg: "bg-amber-50",
      iconBorder: "border-amber-100",
      accent: "text-amber-600",
    },
  ];

  const currentChartData = chartData[chartView] || [];
  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="max-w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isSuperAdmin
            ? "Global overview of all labs"
            : `Overview of ${profile?.labs?.name}`}
        </p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {revenueCards.map((c, i) => (
          <div
            key={i}
            className={`${c.bg} ${c.border} border rounded-2xl p-5 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold uppercase tracking-wide ${c.subText}`}>
                  {c.label}
                </p>
                <p className={`text-2xl font-extrabold mt-1.5 ${c.textColor} truncate`}>
                  {c.value}
                </p>
              </div>
              <div
                className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0 ml-3`}
              >
                {c.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Cards */}
      <div
        className={`grid gap-4 mb-5 ${
          isSuperAdmin
            ? "grid-cols-1 sm:grid-cols-3"
            : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {(isSuperAdmin ? superInfoCards : labInfoCards).map((c, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {c.label}
                </p>
                <p className="text-2xl font-extrabold text-gray-800 mt-1">
                  {c.value}
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-xl ${c.iconBg} ${c.iconBorder} border flex items-center justify-center text-xl flex-shrink-0 ml-3`}
              >
                {c.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart — light gray background */}
      <div className="bg-gray-100 rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Revenue Overview
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {chartView === "daily"
                ? `Daily revenue for ${monthName}`
                : "Monthly revenue this year"}
            </p>
          </div>

          <div className="flex bg-white rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setChartView("daily")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                chartView === "daily"
                  ? "bg-gray-200 text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setChartView("monthly")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                chartView === "monthly"
                  ? "bg-gray-200 text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="h-72">
          {currentChartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <span className="text-4xl block mb-2">📊</span>
                <p>No revenue data yet</p>
              </div>
            </div>
          ) : chartView === "daily" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#d1d5db" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "#94a3b8", fontSize: 12 }}
                  itemStyle={{ color: "#fff", fontWeight: 700 }}
                  formatter={(value) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "Revenue",
                  ]}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Bar
                  dataKey="revenue"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentChartData}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#d1d5db" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "#94a3b8", fontSize: 12 }}
                  itemStyle={{ color: "#fff", fontWeight: 700 }}
                  formatter={(value) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Super admin lab list */}
      {isSuperAdmin && labs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">
              Registered Labs
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3 font-semibold">Lab Name</th>
                  <th className="px-6 py-3 font-semibold">Lab ID</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                  <th className="px-6 py-3 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {labs.map((lab) => (
                  <tr
                    key={lab.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {lab.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">
                          {lab.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                        {lab.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(lab.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteLab(lab.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete Lab
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}