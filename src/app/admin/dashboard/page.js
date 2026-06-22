'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

const adminHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 flex flex-col gap-1">
    <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{label}</p>
    <p className={`text-4xl font-bold ${color ?? 'text-white'}`}>
      {value ?? <span className="text-zinc-600 text-2xl">—</span>}
    </p>
    {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
  </div>
);

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/admin/stats`, { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Overview of your platform.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"    value={stats?.total}    sub="registered accounts" />
        <StatCard label="Active"         value={stats?.active}   sub="can log in"           color="text-emerald-400" />
        <StatCard label="Inactive"       value={stats?.inactive} sub="access disabled"      color="text-red-400" />
        <StatCard label="With Plan"      value={stats?.withPlan} sub="have an active plan"  color="text-amber-400" />
      </div>
    </div>
  );
}
