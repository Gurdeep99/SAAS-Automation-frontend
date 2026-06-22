'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

const adminHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

const EMPTY_FORM = { name: '', price: '', durationDays: '', features: [], modules: [], isActive: true };

export default function AdminPlansPage() {
  const [plans, setPlans]     = useState([]);
  const [users, setUsers]     = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // plan modal
  const [modal, setModal]     = useState(null); // 'create' | 'edit' | 'delete' | 'assign'
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [featureInput, setFeatureInput] = useState('');
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // assign modal
  const [assignUserId, setAssignUserId] = useState('');

  const fileRef = useRef();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/admin/plans`, { headers: adminHeaders() });
      const data = await res.json();
      setPlans(data.plans ?? []);
    } catch { setPlans([]); } finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/admin/users`, { headers: adminHeaders() });
      const data = await res.json();
      setUsers((data.users ?? []).filter(Boolean));
    } catch { setUsers([]); }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/admin/modules`, { headers: adminHeaders() });
      const data = await res.json();
      setAllModules(data.modules ?? []);
    } catch { setAllModules([]); }
  }, []);

  useEffect(() => { fetchPlans(); fetchUsers(); fetchModules(); }, [fetchPlans, fetchUsers, fetchModules]);

  /* ── open modals ── */
  const openCreate = () => {
    setForm(EMPTY_FORM); setPhotoFile(null); setPhotoPreview('');
    setFeatureInput(''); setError(''); setModal('create');
  };
  const openEdit = (plan) => {
    setSelected(plan);
    setForm({ name: plan.name, price: plan.price, durationDays: plan.durationDays, features: [...(plan.features ?? [])], modules: [...(plan.modules ?? [])], isActive: plan.isActive });
    setPhotoFile(null);
    setPhotoPreview(plan.photo ? `${API}${plan.photo}` : '');
    setFeatureInput(''); setError(''); setModal('edit');
  };
  const openDelete = (plan) => { setSelected(plan); setModal('delete'); };
  const openAssign = (plan) => { setSelected(plan); setAssignUserId(''); setError(''); setModal('assign'); };
  const closeModal = () => { setModal(null); setSelected(null); setError(''); };

  /* ── features helpers ── */
  const addFeature = () => {
    const v = featureInput.trim();
    if (!v) return;
    setForm((f) => ({ ...f, features: [...f.features, v] }));
    setFeatureInput('');
  };
  const removeFeature = (i) =>
    setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  /* ── submit helpers ── */
  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('price', form.price);
    fd.append('durationDays', form.durationDays);
    fd.append('features', JSON.stringify(form.features));
    fd.append('modules', JSON.stringify(form.modules));
    fd.append('isActive', form.isActive);
    if (photoFile) fd.append('photo', photoFile);
    return fd;
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res  = await fetch(`${API}/admin/plans`, { method: 'POST', headers: adminHeaders(), body: buildFormData() });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      await fetchPlans(); closeModal();
    } catch { setError('Server error'); } finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); if (!selected?._id) return; setSaving(true); setError('');
    try {
      const res  = await fetch(`${API}/admin/plans/${selected._id}`, { method: 'PUT', headers: adminHeaders(), body: buildFormData() });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      await fetchPlans(); closeModal();
    } catch { setError('Server error'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected?._id) return; setSaving(true);
    try {
      await fetch(`${API}/admin/plans/${selected._id}`, { method: 'DELETE', headers: adminHeaders() });
      await fetchPlans(); closeModal();
    } catch { } finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!selected?._id || !assignUserId) { setError('Please select a user'); return; }
    setSaving(true); setError('');
    try {
      const res  = await fetch(`${API}/admin/plans/assign`, {
        method: 'POST',
        headers: { ...adminHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selected._id, userId: assignUserId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      closeModal();
    } catch { setError('Server error'); } finally { setSaving(false); }
  };

  const planFormJSX = (onSubmit) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Plan Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹)" type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
        <Field label="Duration (days)" type="number" min="1" value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))} required />
      </div>

      {/* Photo */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Plan Photo</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="w-full h-28 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-amber-400 transition-colors overflow-hidden"
        >
          {photoPreview
            ? <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
            : <span className="text-xs text-zinc-500">Click to upload photo</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      {/* Features */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Features</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text" value={featureInput} placeholder="Add a feature…"
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            className="flex-1 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
          <button type="button" onClick={addFeature} className="px-3 py-2 text-sm font-semibold bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors">Add</button>
        </div>
        <div className="space-y-1.5 max-h-28 overflow-y-auto">
          {form.features.map((f, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 rounded-lg">
              <span className="text-sm text-white">{f}</span>
              <button type="button" onClick={() => removeFeature(i)} className="text-zinc-500 hover:text-red-400 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      {allModules.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Included Modules</label>
          <div className="space-y-2">
            {allModules.map((mod) => {
              const checked = form.modules.includes(mod.key);
              return (
                <label key={mod.key} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border transition-colors ${checked ? 'bg-amber-400/5 border-amber-400/30' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        modules: checked
                          ? f.modules.filter((k) => k !== mod.key)
                          : [...f.modules, mod.key],
                      }))
                    }
                    className="w-4 h-4 rounded accent-amber-400"
                  />
                  <span className={`text-sm font-medium ${checked ? 'text-amber-400' : 'text-zinc-300'}`}>{mod.label}</span>
                  {!mod.isActive && <span className="ml-auto text-[10px] text-zinc-500 font-medium">Disabled globally</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Active toggle */}
      <label className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg cursor-pointer">
        <span className="text-sm font-medium text-white">Plan Active</span>
        <button type="button" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
          className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${form.isActive ? 'bg-amber-400' : 'bg-zinc-600'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-amber-400 text-zinc-900 rounded-lg hover:bg-amber-300 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : modal === 'create' ? 'Create Plan' : 'Save Changes'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans</h1>
          <p className="mt-0.5 text-sm text-zinc-400">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-400 text-zinc-900 rounded-lg hover:bg-amber-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Plan
        </button>
      </div>

      {/* Plans grid */}
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : plans.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-400 font-medium">No plans yet</p>
          <p className="text-sm text-zinc-600 mt-1">Click "Add Plan" to create your first plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
              {/* Photo */}
              <div className="h-36 bg-zinc-800 overflow-hidden">
                {plan.photo
                  ? <img src={`${API}${plan.photo}`} alt={plan.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>}
              </div>

              <div className="p-5 flex flex-col flex-1">
                {/* Name + badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${plan.isActive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Price + duration */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl font-bold text-amber-400">₹{plan.price}</span>
                  <span className="text-sm text-zinc-400">{plan.durationDays} days</span>
                </div>

                {/* Features */}
                {plan.features?.length > 0 && (
                  <ul className="space-y-1.5 mb-5 flex-1">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-zinc-500">+{plan.features.length - 4} more</li>
                    )}
                  </ul>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-3 border-t border-zinc-800">
                  <button onClick={() => openAssign(plan)} className="flex-1 py-2 text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-lg hover:bg-amber-400/20 transition-colors">
                    Assign to User
                  </button>
                  <button onClick={() => openEdit(plan)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button onClick={() => openDelete(plan)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" /><path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modal === 'create' && (
        <Modal title="Create Plan" onClose={closeModal}>{planFormJSX(handleCreate)}</Modal>
      )}

      {/* Edit modal */}
      {modal === 'edit' && selected && (
        <Modal title={`Edit — ${selected.name}`} onClose={closeModal}>{planFormJSX(handleEdit)}</Modal>
      )}

      {/* Delete modal */}
      {modal === 'delete' && selected && (
        <Modal title="Delete Plan" onClose={closeModal}>
          <p className="text-sm text-zinc-300 mb-6">
            Delete <span className="font-semibold text-white">{selected.name}</span>? Users with this plan will keep their access until expiry.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-400 disabled:opacity-50 transition-colors">
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {/* Assign modal */}
      {modal === 'assign' && selected && (
        <Modal title={`Assign "${selected.name}"`} onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Select User</label>
              <select
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">— choose a user —</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleAssign} disabled={saving || !assignUserId} className="px-4 py-2 text-sm font-semibold bg-amber-400 text-zinc-900 rounded-lg hover:bg-amber-300 disabled:opacity-50 transition-colors">
                {saving ? 'Assigning…' : 'Assign Plan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, min }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} required={required} min={min}
        className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition" />
    </div>
  );
}
