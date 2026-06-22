'use client';

import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const adminHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

const MODULE_ICONS = {
  whatsapp:  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.878-1.42A9.945 9.945 0 0011.999 22C17.522 22 22 17.523 22 12S17.522 2 11.999 2zm0 18.18c-1.706 0-3.3-.46-4.67-1.266l-.334-.199-3.464 1.008 1.033-3.365-.217-.348A8.124 8.124 0 013.818 12c0-4.515 3.667-8.18 8.181-8.18 4.513 0 8.18 3.665 8.18 8.18 0 4.514-3.667 8.18-8.18 8.18z"/></svg>,
  instagram: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  blogs:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  gmb:       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
};

export default function AdminModulesPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/admin/modules`, { headers: adminHeaders() });
      const data = await res.json();
      setModules(data.modules ?? []);
    } catch { setModules([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const toggleModule = async (key, currentActive) => {
    setToggling(key);
    try {
      await fetch(`${API}/admin/modules/${key}/status`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setModules((prev) =>
        prev.map((m) => (m.key === key ? { ...m, isActive: !currentActive } : m))
      );
    } catch { } finally { setToggling(null); }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Modules</h1>
        <p className="mt-0.5 text-sm text-zinc-400">
          Enable or disable modules globally. Disabled modules are hidden from all users even if their plan includes them.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div key={mod.key} className={`bg-zinc-900 border rounded-2xl p-5 flex gap-4 items-start transition-colors ${mod.isActive ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'}`}>
              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${mod.isActive ? 'bg-amber-400/10 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {MODULE_ICONS[mod.icon] ?? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white truncate">{mod.label}</h3>
                  <button
                    onClick={() => toggleModule(mod.key, mod.isActive)}
                    disabled={toggling === mod.key}
                    className={`relative shrink-0 inline-flex w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${mod.isActive ? 'bg-amber-400' : 'bg-zinc-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${mod.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{mod.description}</p>
                <p className="mt-2 text-[10px] font-mono text-zinc-600">{mod.key}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
