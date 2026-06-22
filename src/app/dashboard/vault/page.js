'use client';

import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const h   = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

// Catalog of integrations that read from the vault. The user only ever pastes a
// key value — the underlying property `name` is auto-assigned from here, so no
// Name/Label fields are shown.
const CATALOG = [
  {
    name: 'OPENROUTER_API_KEY',
    label: 'OpenRouter API Key',
    hint: 'Powers WhatsApp → AI Auto Responder.',
    placeholder: 'sk-or-v1-…',
    getLink: 'https://openrouter.ai/keys',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

function Banner({ ok, msg }) {
  if (!msg) return null;
  return (
    <p className={`text-sm px-4 py-2.5 rounded-xl border mb-4 ${ok ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-red-400/10 border-red-400/20 text-red-400'}`}>
      {msg}
    </p>
  );
}

export default function VaultPage() {
  const [creds, setCreds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner]   = useState(null);
  const [revealed, setRevealed] = useState({}); // { [id]: plaintext }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/vault/credentials`, { headers: h() });
      const data = await res.json();
      setCreds(data.credentials ?? []);
    } catch { setBanner({ ok: false, msg: 'Failed to load vault' }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byName = (name) => creds.find((c) => c.name === name);

  const saveKey = async (slot, value) => {
    setBanner(null);
    const existing = byName(slot.name);
    const url    = existing ? `${API}/vault/credentials/${existing._id}` : `${API}/vault/credentials`;
    const method = existing ? 'PUT' : 'POST';
    // Name + label auto-assigned from the catalog — user never types them.
    const body   = existing ? { value } : { name: slot.name, label: slot.label, value };
    const res    = await fetch(url, { method, headers: h(), body: JSON.stringify(body) });
    const data   = await res.json();
    if (res.ok) { setBanner({ ok: true, msg: `${slot.label} saved securely` }); load(); return true; }
    setBanner({ ok: false, msg: data.message || 'Save failed' });
    return false;
  };

  const del = async (slot) => {
    const existing = byName(slot.name);
    if (!existing) return;
    if (!confirm(`Remove your ${slot.label}? Anything using it will stop working.`)) return;
    await fetch(`${API}/vault/credentials/${existing._id}`, { method: 'DELETE', headers: h() });
    setRevealed((r) => { const n = { ...r }; delete n[existing._id]; return n; });
    setBanner({ ok: true, msg: `${slot.label} removed` });
    load();
  };

  const reveal = async (id) => {
    if (revealed[id]) { setRevealed((r) => { const n = { ...r }; delete n[id]; return n; }); return; }
    try {
      const res  = await fetch(`${API}/vault/credentials/${id}/reveal`, { headers: h() });
      const data = await res.json();
      if (res.ok) setRevealed((r) => ({ ...r, [id]: data.value }));
    } catch {}
  };

  const copy = async (id) => {
    try {
      let val = revealed[id];
      if (!val) {
        const res = await fetch(`${API}/vault/credentials/${id}/reveal`, { headers: h() });
        val = (await res.json()).value;
      }
      await navigator.clipboard.writeText(val);
      setBanner({ ok: true, msg: 'Copied to clipboard' });
    } catch { setBanner({ ok: false, msg: 'Copy failed' }); }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Credential Management</h1>
      </div>
      <p className="text-sm text-zinc-400 mb-6 ml-12 -mt-1">
        Your private encrypted vault. Secrets are encrypted at rest and only ever accessible to your account.
        Just paste a key — it&apos;s assigned to the right integration automatically.
      </p>

      <Banner ok={banner?.ok} msg={banner?.msg} />

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="space-y-4">
          {CATALOG.map((slot) => (
            <CredentialSlot
              key={slot.name}
              slot={slot}
              cred={byName(slot.name)}
              revealedValue={byName(slot.name) ? revealed[byName(slot.name)._id] : undefined}
              onSave={(value) => saveKey(slot, value)}
              onDelete={() => del(slot)}
              onReveal={() => byName(slot.name) && reveal(byName(slot.name)._id)}
              onCopy={() => byName(slot.name) && copy(byName(slot.name)._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CredentialSlot({ slot, cred, revealedValue, onSave, onDelete, onReveal, onCopy }) {
  const [value, setValue]   = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSet = !!cred;

  const submit = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setSaving(true);
    const ok = await onSave(value.trim());
    setSaving(false);
    if (ok) { setValue(''); setEditing(false); }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
          {slot.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{slot.label}</h3>
            {isSet && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-green-400/10 text-green-400 border border-green-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Connected
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{slot.hint}</p>
        </div>
        {slot.getLink && (
          <a href={slot.getLink} target="_blank" rel="noreferrer"
            className="text-xs text-zinc-400 hover:text-white underline shrink-0">Get key →</a>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {isSet && !editing ? (
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm font-mono text-zinc-400 truncate">
              {revealedValue ?? cred.masked}
            </code>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onReveal} title={revealedValue ? 'Hide' : 'Reveal'}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                {revealedValue ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
              <button onClick={onCopy} title="Copy"
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button onClick={() => setEditing(true)} title="Replace"
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={onDelete} title="Remove"
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="flex gap-2">
            <input
              type="password" value={value} onChange={(e) => setValue(e.target.value)}
              placeholder={slot.placeholder} autoComplete="off" autoFocus={editing}
              className="flex-1 px-3.5 py-2.5 text-sm font-mono bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
            {editing && (
              <button type="button" onClick={() => { setEditing(false); setValue(''); }}
                className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors shrink-0">Cancel</button>
            )}
            <button type="submit" disabled={saving || !value.trim()}
              className="px-4 py-2 text-sm font-semibold bg-amber-400 text-zinc-900 rounded-lg hover:bg-amber-300 disabled:opacity-50 transition-colors shrink-0">
              {saving ? 'Saving…' : isSet ? 'Update' : 'Add Key'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
