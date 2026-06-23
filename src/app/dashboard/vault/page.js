'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

          <WhatsAppConnection onBanner={setBanner} />
        </div>
      )}
    </div>
  );
}

/* ─── WhatsApp Connection (QR + Cloud API) ─────────────── */
// The whole WhatsApp connection experience lives here. The Cloud API token is a
// secret stored in the vault (WHATSAPP_CLOUD_TOKEN); the Phone Number ID and
// WABA ID are plain identifiers on the connection record. QR uses the Baileys
// session endpoints.
const WA_ICON = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.878-1.42A9.945 9.945 0 0011.999 22C17.522 22 22 17.523 22 12S17.522 2 11.999 2z"/></svg>
);

function ModeCard({ active, onClick, title, desc, icon }) {
  return (
    <button onClick={onClick} type="button"
      className={`text-left p-4 rounded-xl border transition-colors ${
        active ? 'bg-green-400/10 border-green-400/40' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
      }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={active ? 'text-green-400' : 'text-zinc-400'}>{icon}</span>
        <span className="text-sm font-semibold text-white">{title}</span>
        {active && <span className="ml-auto w-2 h-2 rounded-full bg-green-400" />}
      </div>
      <p className="text-xs text-zinc-500">{desc}</p>
    </button>
  );
}

function WhatsAppConnection({ onBanner }) {
  const [conn, setConn] = useState({ mode: 'qr', status: 'disconnected', qrBase64: null, phone: null, error: null, cloud: {} });
  const pollRef = useRef(null);

  const fetchConn = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/whatsapp/connection`, { headers: h() });
      const data = await res.json();
      setConn(data);
      return data.status;
    } catch { return null; }
  }, []);

  useEffect(() => { fetchConn(); }, [fetchConn]);

  // Poll while a QR session is connecting/waiting for scan; slow heartbeat when connected.
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (conn.mode === 'qr' && ['qr', 'connecting'].includes(conn.status)) {
      pollRef.current = setInterval(fetchConn, 2500);
    } else if (conn.status === 'connected') {
      pollRef.current = setInterval(fetchConn, 20_000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conn.mode, conn.status, fetchConn]);

  const startSession = async () => { await fetch(`${API}/whatsapp/session/start`, { method: 'POST', headers: h() }); await fetchConn(); };
  const logout       = async () => { await fetch(`${API}/whatsapp/session/logout`, { method: 'DELETE', headers: h() }); await fetchConn(); };
  const setMode      = async (mode) => { await fetch(`${API}/whatsapp/connection/mode`, { method: 'PUT', headers: h(), body: JSON.stringify({ mode }) }); await fetchConn(); };

  const mode = conn.mode || 'qr';

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-lg bg-green-400/10 text-green-400 flex items-center justify-center shrink-0">{WA_ICON}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">WhatsApp Connection</h3>
            {conn.status === 'connected' && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-green-400/10 text-green-400 border border-green-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Connected
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">Connect via QR or the official Cloud API. Powers every WhatsApp feature.</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <ModeCard active={mode === 'qr'} onClick={() => setMode('qr')}
            title="QR Code" desc="Scan with your phone. Quickest to set up."
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>} />
          <ModeCard active={mode === 'cloud'} onClick={() => setMode('cloud')}
            title="Official API" desc="WhatsApp Cloud API for verified business numbers."
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>} />
        </div>

        {mode === 'qr'
          ? <QrPanel conn={conn} onStartQR={startSession} onLogoutQR={logout} />
          : <CloudConnect conn={conn} onRefresh={fetchConn} onBanner={onBanner} />}
      </div>
    </div>
  );
}

function QrPanel({ conn, onStartQR, onLogoutQR }) {
  const [loading, setLoading] = useState(false);
  const start = async () => { setLoading(true); await onStartQR(); setLoading(false); };

  if (conn.status === 'connected') {
    return (
      <div className="bg-green-400/5 border border-green-400/20 rounded-2xl p-8 text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-green-400/10 text-green-400 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 className="text-lg font-bold text-white">Connected</h3>
        {conn.phone && <p className="text-sm text-zinc-400 mt-1 font-mono">{String(conn.phone).split('@')[0]}</p>}
        <p className="text-xs text-zinc-500 mt-3 mb-6">Your WhatsApp is active. All features are available.</p>
        <button onClick={onLogoutQR} className="w-full py-2 text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors">
          Logout / Disconnect
        </button>
      </div>
    );
  }

  if (conn.status === 'qr' && conn.qrBase64) {
    return (
      <div className="max-w-sm">
        <h3 className="text-base font-bold text-white mb-1">Scan QR Code</h3>
        <p className="text-sm text-zinc-400 mb-5">Open WhatsApp → <strong>Settings</strong> → <strong>Linked Devices</strong> → <strong>Link a Device</strong></p>
        <div className="bg-white rounded-2xl p-4 inline-block mb-5 shadow-lg">
          <img src={conn.qrBase64} alt="WhatsApp QR" width={240} height={240} />
        </div>
        <p className="flex items-center gap-2 text-xs text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          Waiting for scan… QR refreshes automatically
        </p>
      </div>
    );
  }

  if (conn.status === 'connecting') {
    return (
      <div className="flex items-center gap-3 text-zinc-400">
        <span className="w-4 h-4 border-2 border-zinc-600 border-t-green-400 rounded-full animate-spin shrink-0" />
        Connecting to WhatsApp…
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      {conn.error && <Banner ok={false} msg={conn.error} />}
      <button onClick={start} disabled={loading}
        className="w-full py-3 text-sm font-semibold bg-green-400 text-zinc-900 rounded-xl hover:bg-green-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
        {loading
          ? <><span className="w-4 h-4 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" /> Initialising…</>
          : 'Generate QR Code'}
      </button>
      <p className="mt-4 text-xs text-zinc-500">Sessions persist across reloads and server restarts.</p>
    </div>
  );
}

function CloudConnect({ conn, onRefresh, onBanner }) {
  const c = conn.cloud || {};
  const [pid, setPid]     = useState('');
  const [waba, setWaba]   = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving]     = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Sync the identifier fields from the server whenever they change.
  useEffect(() => { setPid(c.phoneNumberId || ''); setWaba(c.wabaId || ''); }, [c.phoneNumberId, c.wabaId]);

  const save = async (e) => {
    e.preventDefault();
    if (!pid.trim()) { onBanner({ ok: false, msg: 'Phone Number ID is required' }); return; }
    setSaving(true); onBanner(null);
    try {
      const body = { phoneNumberId: pid.trim(), wabaId: waba.trim() };
      if (token.trim()) body.token = token.trim();
      const res  = await fetch(`${API}/whatsapp/cloud/config`, { method: 'POST', headers: h(), body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) { onBanner({ ok: true, msg: 'WhatsApp credentials saved. Set the webhook in Meta, then Verify.' }); setToken(''); onRefresh(); }
      else        onBanner({ ok: false, msg: data.message || 'Save failed' });
    } catch { onBanner({ ok: false, msg: 'Network error' }); }
    setSaving(false);
  };

  const verify = async () => {
    setVerifying(true); onBanner(null);
    try {
      const res  = await fetch(`${API}/whatsapp/cloud/verify`, { method: 'POST', headers: h() });
      const data = await res.json();
      if (res.ok) { onBanner({ ok: true, msg: `Verified — ${data.phone || 'connected'}` }); onRefresh(); }
      else        onBanner({ ok: false, msg: data.message || 'Verification failed' });
    } catch { onBanner({ ok: false, msg: 'Network error' }); }
    setVerifying(false);
  };

  const copy = (val) => navigator.clipboard.writeText(val).then(() => onBanner({ ok: true, msg: 'Copied' })).catch(() => {});
  const ready = c.phoneNumberId && c.hasToken;

  return (
    <div className="space-y-5">
      {c.verified && (
        <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/5 border border-green-400/20 rounded-xl px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          Connected via Cloud API{c.connectedPhone ? ` — ${c.connectedPhone}` : ''}
        </div>
      )}

      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone Number ID <span className="text-red-400">*</span></label>
          <input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="e.g. 123456789012345" autoComplete="off"
            className="w-full px-3.5 py-2.5 text-sm font-mono bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">WhatsApp Business Account ID (WABA ID)</label>
          <input value={waba} onChange={(e) => setWaba(e.target.value)} placeholder="e.g. 987654321098765" autoComplete="off"
            className="w-full px-3.5 py-2.5 text-sm font-mono bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
          <p className="text-[11px] text-zinc-500 mt-1">Required for Message Templates.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Permanent Access Token {!c.hasToken && <span className="text-red-400">*</span>}
            {c.hasToken && <span className="text-zinc-500 font-normal ml-1">(saved — leave blank to keep)</span>}
          </label>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="EAAG…" autoComplete="off"
            className="w-full px-3.5 py-2.5 text-sm font-mono bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
          <p className="text-[11px] text-zinc-500 mt-1">Stored encrypted as WHATSAPP_CLOUD_TOKEN.</p>
        </div>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-semibold bg-amber-400 text-zinc-900 rounded-lg hover:bg-amber-300 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save Credentials'}
        </button>
      </form>

      {/* Webhook setup */}
      {c.webhookUrl && (
        <div className="bg-zinc-800/50 border border-zinc-700/60 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white mb-1">Webhook setup</h4>
          <p className="text-xs text-zinc-500 mb-4">In Meta → WhatsApp → Configuration, paste these and subscribe to the <span className="font-mono">messages</span> field.</p>

          <label className="block text-[11px] font-medium text-zinc-400 mb-1">Callback URL</label>
          <div className="flex gap-2 mb-3">
            <code className="flex-1 text-xs font-mono text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 truncate">{c.webhookUrl}</code>
            <button onClick={() => copy(c.webhookUrl)} type="button" className="px-3 text-xs bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 shrink-0">Copy</button>
          </div>

          <label className="block text-[11px] font-medium text-zinc-400 mb-1">Verify Token</label>
          <div className="flex gap-2">
            <code className="flex-1 text-xs font-mono text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 truncate">{c.verifyToken || '— save credentials first —'}</code>
            {c.verifyToken && <button onClick={() => copy(c.verifyToken)} type="button" className="px-3 text-xs bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 shrink-0">Copy</button>}
          </div>
        </div>
      )}

      {!ready && <p className="text-xs text-amber-400">Save your Phone Number ID and access token before verifying.</p>}
      <button onClick={verify} disabled={verifying || !ready}
        className="w-full py-2.5 text-sm font-semibold bg-zinc-100 text-zinc-900 rounded-xl hover:bg-white disabled:opacity-40 transition-colors">
        {verifying ? 'Verifying…' : c.verified ? 'Re-verify Connection' : 'Verify Connection'}
      </button>
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
