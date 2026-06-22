'use client';

import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

export default function UsersPage() {
  const [users, setUsers]     = useState([]);
  const [modules, setModules] = useState([]);
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  // module access modal
  const [moduleModal, setModuleModal]   = useState(false);
  const [selected, setSelected]         = useState(null);
  const [moduleAccess, setModuleAccess] = useState([]);
  const [saving, setSaving]             = useState(false);

  // assign plan modal
  const [planModal, setPlanModal]       = useState(false);
  const [assignPlanId, setAssignPlanId] = useState('');
  const [planError, setPlanError]       = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/admin/users`, { headers: authHeaders() });
      const data = await res.json();
      setUsers((data.users ?? []).filter(Boolean));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/admin/modules`, { headers: authHeaders() });
      const data = await res.json();
      setModules(data.modules ?? []);
    } catch {
      setModules([]);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/admin/plans`, { headers: authHeaders() });
      const data = await res.json();
      setPlans((data.plans ?? []).filter((p) => p.isActive));
    } catch {
      setPlans([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchModules();
    fetchPlans();
  }, [fetchUsers, fetchModules, fetchPlans]);

  /* ── Status toggle ── */
  const handleToggleStatus = async (user) => {
    if (!user?._id) return;
    try {
      await fetch(`${API}/admin/users/${user._id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      await fetchUsers();
    } catch { /* silent */ }
  };

  /* ── Module access ── */
  const openModules = (user) => {
    setSelected(user);
    setModuleAccess(
      modules.map((m) => {
        const existing = user.moduleAccess?.find((ma) => ma.moduleName === m.key);
        return { moduleName: m.key, hasAccess: existing?.hasAccess ?? false };
      })
    );
    setModuleModal(true);
  };

  const toggleModule = (key) =>
    setModuleAccess((prev) =>
      prev.map((m) => (m.moduleName === key ? { ...m, hasAccess: !m.hasAccess } : m))
    );

  const handleSaveModules = async () => {
    if (!selected?._id) return;
    setSaving(true);
    try {
      await fetch(`${API}/admin/users/${selected._id}/modules`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ moduleAccess }),
      });
      await fetchUsers();
      setModuleModal(false);
      setSelected(null);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  };

  /* ── Assign Plan ── */
  const openPlanModal = (user) => {
    setSelected(user);
    setAssignPlanId(user.activePlan?.plan?._id ?? user.activePlan?.plan ?? '');
    setPlanError('');
    setPlanModal(true);
  };

  const handleAssignPlan = async () => {
    if (!selected?._id || !assignPlanId) { setPlanError('Please select a plan'); return; }
    setSaving(true); setPlanError('');
    try {
      const res  = await fetch(`${API}/admin/plans/assign`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId: selected._id, planId: assignPlanId }),
      });
      const data = await res.json();
      if (!res.ok) { setPlanError(data.message); return; }
      await fetchUsers();
      setPlanModal(false); setSelected(null);
    } catch { setPlanError('Server error'); } finally { setSaving(false); }
  };

  /* ── Impersonate ── */
  const handleLoginAsUser = async (user) => {
    if (!user?._id) return;
    try {
      const res  = await fetch(`${API}/admin/users/${user._id}/impersonate`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }

      // Store in the same keys the user dashboard reads
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      window.open('/dashboard', '_blank');
    } catch {
      alert('Could not generate impersonation token.');
    }
  };

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="mt-0.5 text-sm text-zinc-400">{users.length} total users</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-zinc-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-zinc-500">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Modules</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((user) => {
                const initials     = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
                const enabledCount = user.moduleAccess?.filter((m) => m.hasAccess).length ?? 0;
                const userPlan     = user.activePlan?.plan;
                const planEnd      = user.activePlan?.endDate ? new Date(user.activePlan.endDate) : null;
                const planActive   = planEnd && planEnd > new Date();

                return (
                  <tr key={user._id} className="hover:bg-zinc-800/40 transition-colors">
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-zinc-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3.5 text-zinc-300">{user.phoneNumber}</td>

                    {/* Status toggle */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          user.isActive
                            ? 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                            : 'bg-red-400/10 text-red-400 hover:bg-red-400/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openPlanModal(user)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          planActive
                            ? 'bg-amber-400/10 text-amber-400 border-amber-400/20 hover:bg-amber-400/20'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        {planActive && userPlan ? (userPlan.name ?? 'Plan') : 'No plan'}
                      </button>
                    </td>

                    {/* Modules */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openModules(user)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        {enabledCount}/{modules.length} modules
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleLoginAsUser(user)}
                          disabled={!user.isActive}
                          title={user.isActive ? 'Login as this user' : 'User is inactive'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                          </svg>
                          Login as User
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Module access modal */}
      {moduleModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-white">
                Module Access — {selected.firstName} {selected.lastName}
              </h2>
              <button
                onClick={() => { setModuleModal(false); setSelected(null); }}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              {modules.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-zinc-300">No modules yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Modules will appear here as they are added to the platform.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {modules.map((m) => {
                    const entry = moduleAccess.find((ma) => ma.moduleName === m.key);
                    return (
                      <label
                        key={m.key}
                        className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700/60 transition-colors"
                      >
                        <span className="text-sm font-medium text-white">{m.label}</span>
                        <button
                          type="button"
                          onClick={() => toggleModule(m.key)}
                          className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${entry?.hasAccess ? 'bg-amber-400' : 'bg-zinc-600'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${entry?.hasAccess ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => { setModuleModal(false); setSelected(null); }}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                {modules.length > 0 && (
                  <button
                    onClick={handleSaveModules}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-semibold bg-amber-400 text-zinc-900 rounded-lg hover:bg-amber-300 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign plan modal */}
      {planModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-white">
                Assign Plan — {selected.firstName} {selected.lastName}
              </h2>
              <button onClick={() => { setPlanModal(false); setSelected(null); }} className="p-1 text-zinc-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Select Plan</label>
                <select
                  value={assignPlanId}
                  onChange={(e) => setAssignPlanId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">— choose a plan —</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} — ₹{p.price} / {p.durationDays} days</option>
                  ))}
                </select>
              </div>
              {planError && <p className="text-sm text-red-400">{planError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => { setPlanModal(false); setSelected(null); }} className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleAssignPlan} disabled={saving || !assignPlanId} className="px-4 py-2 text-sm font-semibold bg-amber-400 text-zinc-900 rounded-lg hover:bg-amber-300 disabled:opacity-50 transition-colors">
                  {saving ? 'Assigning…' : 'Assign Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
