'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;
const h   = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ─── sidebar feature list ─────────────────────────────── */
const FEATURES = [
  { key: 'send',         label: 'Send Message',        icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> },
  { key: 'inbox',        label: 'Get Message',         icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> },
  { key: 'contacts',     label: 'Contact Details',     icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key: 'campaign',     label: 'Campaign',            icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg> },
  { key: 'autoresponder',label: 'Quick Reply',         icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg> },
  { key: 'chatbot',      label: 'Chatbot (Workflow)',  icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { key: 'form',         label: 'Form Creation',       icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { key: 'ai',           label: 'AI Auto Responder',   icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { key: 'templates',    label: 'Message Templates',   cloudOnly: true, icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
  { key: 'ecommerce',    label: 'E-commerce',          icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
];

const COMING_SOON = ['chatbot', 'form'];

/* ─── shared helpers ───────────────────────────────────── */
function Banner({ type = 'error', msg }) {
  if (!msg) return null;
  const cls = type === 'success'
    ? 'bg-green-400/10 border-green-400/20 text-green-400'
    : 'bg-red-400/10 border-red-400/20 text-red-400';
  return <p className={`text-sm px-4 py-2.5 rounded-xl border mb-4 ${cls}`}>{msg}</p>;
}

function NotConnected() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.878-1.42A9.945 9.945 0 0011.999 22C17.522 22 22 17.523 22 12S17.522 2 11.999 2z"/>
        </svg>
      </div>
      <p className="text-sm font-semibold text-zinc-300">WhatsApp not connected</p>
      <p className="text-xs text-zinc-500 mt-1">Connect WhatsApp in <a href="/dashboard/vault" className="underline text-green-400 hover:text-green-300">Credential Management</a> first (QR or Official API).</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition" />
    </div>
  );
}

/* ─── SEND TAB ─────────────────────────────────────────── */
function SendTab({ connected }) {
  const [phone, setPhone]     = useState('');
  const [msg, setMsg]         = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null);

  if (!connected) return <NotConnected />;

  const send = async (e) => {
    e.preventDefault();
    setSending(true); setResult(null);
    try {
      const res  = await fetch(`${API}/whatsapp/send`, { method: 'POST', headers: h(), body: JSON.stringify({ phone, message: msg }) });
      const data = await res.json();
      if (res.ok) { setResult({ ok: true, text: 'Message sent!' }); setPhone(''); setMsg(''); }
      else          setResult({ ok: false, text: data.message });
    } catch { setResult({ ok: false, text: 'Network error' }); }
    setSending(false);
  };

  return (
    <div className="p-8 max-w-lg">
      <h2 className="text-lg font-bold text-white mb-1">Send Message</h2>
      <p className="text-sm text-zinc-400 mb-6">Send a WhatsApp message to any number.</p>
      <Banner type={result?.ok ? 'success' : 'error'} msg={result?.text} />
      <form onSubmit={send} className="space-y-4">
        <Input label="Phone Number (with country code)" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="e.g. 919876543210" required />
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Message <span className="text-red-400">*</span></label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5} required
            placeholder="Type your message here…"
            className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none transition" />
        </div>
        <button type="submit" disabled={sending || !phone || !msg}
          className="w-full py-2.5 text-sm font-semibold bg-green-400 text-zinc-900 rounded-xl hover:bg-green-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {sending ? <><span className="w-4 h-4 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" /> Sending…</> : 'Send Message'}
        </button>
      </form>
      <p className="mt-4 text-xs text-zinc-500">Enter the number without + or spaces. Recipient must have WhatsApp.</p>
    </div>
  );
}

/* ─── INBOX TAB ────────────────────────────────────────── */
function InboxTab({ connected }) {
  const [messages, setMessages] = useState([]);
  const [total, setTotal]       = useState(0);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/whatsapp/messages?filter=${filter}&limit=100`, { headers: h() });
      const data = await res.json();
      setMessages(data.messages ?? []);
      setTotal(data.total ?? 0);
    } catch { } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { if (connected) load(); }, [connected, load]);

  const clear = async () => {
    if (!confirm('Clear all message history?')) return;
    setClearing(true);
    await fetch(`${API}/whatsapp/messages`, { method: 'DELETE', headers: h() });
    setMessages([]); setTotal(0);
    setClearing(false);
  };

  const fmt = (jid) => jid?.replace('@s.whatsapp.net', '').replace('@g.us', ' (Group)') ?? '—';
  const ts  = (d)   => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (!connected) return <NotConnected />;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Messages</h2>
          <p className="text-sm text-zinc-400">{total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden text-xs">
            {['all', 'incoming', 'outgoing'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 font-medium capitalize transition-colors ${filter === f ? 'bg-green-400 text-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          <button onClick={clear} disabled={clearing} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">No messages yet.</div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m._id} className={`flex gap-3 p-4 rounded-xl border ${m.type === 'incoming' ? 'bg-zinc-900 border-zinc-800' : 'bg-green-400/5 border-green-400/10 flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${m.type === 'incoming' ? 'bg-zinc-700 text-zinc-300' : 'bg-green-400/20 text-green-400'}`}>
                {m.type === 'incoming' ? '↙' : '↗'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-zinc-400">{fmt(m.type === 'incoming' ? m.from : m.to)}</span>
                  <span className="text-[10px] text-zinc-600">{ts(m.timestamp)}</span>
                </div>
                <p className="text-sm text-zinc-200 break-words">{m.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── AUTO RESPONDER TAB ───────────────────────────────── */
function AutoResponderTab({ connected }) {
  const [rules, setRules]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ keyword: '', reply: '', matchType: 'contains' });
  const [err, setErr]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/whatsapp/auto-responders`, { headers: h() });
      const data = await res.json();
      setRules(data.rules ?? []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm({ keyword: '', reply: '', matchType: 'contains' }); setEditId(null); setErr(''); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const url    = editId ? `${API}/whatsapp/auto-responders/${editId}` : `${API}/whatsapp/auto-responders`;
      const method = editId ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: h(), body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) { setErr(data.message); setSaving(false); return; }
      reset(); await load();
    } catch { setErr('Network error'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm('Delete this rule?')) return;
    await fetch(`${API}/whatsapp/auto-responders/${id}`, { method: 'DELETE', headers: h() });
    await load();
  };

  const toggle = async (id) => {
    await fetch(`${API}/whatsapp/auto-responders/${id}/toggle`, { method: 'PATCH', headers: h() });
    await load();
  };

  const startEdit = (rule) => {
    setEditId(rule._id);
    setForm({ keyword: rule.keyword, reply: rule.reply, matchType: rule.matchType });
  };

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-lg font-bold text-white mb-1">Quick Reply</h2>
      <p className="text-sm text-zinc-400 mb-6">Auto-reply when an incoming message matches a keyword.</p>

      {/* Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">{editId ? 'Edit Rule' : 'Add New Rule'}</h3>
        <Banner type="error" msg={err} />
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Keyword" value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))} placeholder="e.g. hello" required />
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Match Type</label>
              <select value={form.matchType} onChange={e => setForm(f => ({ ...f, matchType: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="contains">Contains</option>
                <option value="exact">Exact match</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Reply Message <span className="text-red-400">*</span></label>
            <textarea value={form.reply} onChange={e => setForm(f => ({ ...f, reply: e.target.value }))} rows={3} required
              placeholder="The auto-reply message…"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none transition" />
          </div>
          <div className="flex justify-end gap-2">
            {editId && <button type="button" onClick={reset} className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">Cancel</button>}
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm font-semibold bg-green-400 text-zinc-900 rounded-lg hover:bg-green-300 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : editId ? 'Update Rule' : 'Add Rule'}
            </button>
          </div>
        </form>
      </div>

      {/* Rules list */}
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : rules.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No rules yet. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r._id} className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${r.isActive ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-900/50 border-zinc-800/50 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{r.keyword}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">{r.matchType}</span>
                  {!r.isActive && <span className="text-[10px] text-zinc-500">Paused</span>}
                </div>
                <p className="text-xs text-zinc-400 truncate">{r.reply}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggle(r._id)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${r.isActive ? 'bg-green-400' : 'bg-zinc-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.isActive ? 'translate-x-4' : ''}`} />
                </button>
                <button onClick={() => startEdit(r)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => del(r._id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── E-COMMERCE TAB ───────────────────────────────────── */
const EC_TYPES = [
  { key: 'order-placed',      label: 'Order Placed',       color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20',  emoji: '🎉', extra: ['amount', 'itemName'] },
  { key: 'out-for-delivery',  label: 'Out for Delivery',   color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   emoji: '🚚', extra: ['trackingUrl'] },
  { key: 'delivered',         label: 'Delivered',          color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  emoji: '✅', extra: [] },
  { key: 'cancelled',         label: 'Cancelled',          color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    emoji: '❌', extra: ['reason'] },
];

function EcCard({ type, connected }) {
  const BLANK = { phone: '', orderId: '', customerName: '', amount: '', itemName: '', trackingUrl: '', reason: '' };
  const [form, setForm]     = useState(BLANK);
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null);
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const send = async (e) => {
    e.preventDefault(); setSending(true); setResult(null);
    try {
      const res  = await fetch(`${API}/whatsapp/ecommerce/${type.key}`, { method: 'POST', headers: h(), body: JSON.stringify(form) });
      const data = await res.json();
      setResult({ ok: res.ok, text: res.ok ? 'Notification sent!' : data.message });
      if (res.ok) setForm(BLANK);
    } catch { setResult({ ok: false, text: 'Network error' }); }
    setSending(false);
  };

  return (
    <div className={`rounded-2xl border ${type.border} overflow-hidden`}>
      <div className={`flex items-center gap-3 px-5 py-3.5 ${type.bg}`}>
        <span className="text-lg">{type.emoji}</span>
        <h3 className={`text-sm font-bold ${type.color}`}>{type.label}</h3>
      </div>
      <div className="p-5 bg-zinc-900">
        <Banner type={result?.ok ? 'success' : 'error'} msg={result?.text} />
        <form onSubmit={send} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone (with country code)" value={form.phone} onChange={e => f('phone')(e.target.value)} placeholder="919876543210" required />
            <Input label="Order ID" value={form.orderId} onChange={e => f('orderId')(e.target.value)} placeholder="ORD-001" required />
            <Input label="Customer Name" value={form.customerName} onChange={e => f('customerName')(e.target.value)} placeholder="Rahul Sharma" />
            {type.extra.includes('amount')      && <Input label="Amount (₹)" value={form.amount}      onChange={e => f('amount')(e.target.value)}      placeholder="999" />}
            {type.extra.includes('itemName')    && <Input label="Item Name"  value={form.itemName}    onChange={e => f('itemName')(e.target.value)}    placeholder="iPhone Case" />}
            {type.extra.includes('trackingUrl') && <Input label="Tracking URL" value={form.trackingUrl} onChange={e => f('trackingUrl')(e.target.value)} placeholder="https://track.yourstore.com/…" />}
            {type.extra.includes('reason')      && <Input label="Reason"     value={form.reason}      onChange={e => f('reason')(e.target.value)}      placeholder="Out of stock" />}
          </div>
          <button type="submit" disabled={sending || !connected}
            className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${type.bg} ${type.color} border ${type.border} hover:opacity-80`}>
            {sending ? 'Sending…' : `Send ${type.label} Notification`}
          </button>
        </form>
      </div>
    </div>
  );
}

function EcommerceTab({ connected }) {
  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-lg font-bold text-white mb-1">E-commerce Notifications</h2>
      <p className="text-sm text-zinc-400 mb-6">Send order status WhatsApp messages to customers.</p>
      {!connected && <div className="mb-6"><NotConnected /></div>}
      <div className="space-y-4">
        {EC_TYPES.map((t) => <EcCard key={t.key} type={t} connected={connected} />)}
      </div>
    </div>
  );
}

/* ─── AI AUTO RESPONDER TAB ────────────────────────────── */
function AITab({ connected }) {
  const [cfg, setCfg]         = useState({ isEnabled: false, systemPrompt: '', model: 'openai/gpt-4o-mini' });
  const [models, setModels]   = useState([]);
  const [hasApiKey, setHasKey] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  // test box
  const [testInput, setTestInput]   = useState('Hi');
  const [testReply, setTestReply]   = useState('');
  const [testing, setTesting]       = useState(false);
  const [testErr, setTestErr]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        fetch(`${API}/whatsapp/ai-config`, { headers: h() }).then(r => r.json()),
        fetch(`${API}/whatsapp/ai-models`, { headers: h() }).then(r => r.json()),
      ]);
      setCfg({
        isEnabled:    c.config?.isEnabled ?? false,
        systemPrompt: c.config?.systemPrompt ?? '',
        model:        c.config?.model ?? 'openai/gpt-4o-mini',
      });
      setHasKey(c.hasApiKey);
      setModels(m.models ?? []);
    } catch { setMsg({ ok: false, text: 'Failed to load AI settings' }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e?.preventDefault(); setSaving(true); setMsg(null);
    try {
      const res = await fetch(`${API}/whatsapp/ai-config`, { method: 'PUT', headers: h(), body: JSON.stringify(cfg) });
      const data = await res.json();
      if (res.ok) setMsg({ ok: true, text: 'AI settings saved' });
      else        setMsg({ ok: false, text: data.message || 'Save failed' });
    } catch { setMsg({ ok: false, text: 'Network error' }); }
    setSaving(false);
  };

  const runTest = async () => {
    setTesting(true); setTestErr(null); setTestReply('');
    try {
      const res = await fetch(`${API}/whatsapp/ai-test`, { method: 'POST', headers: h(), body: JSON.stringify({ message: testInput }) });
      const data = await res.json();
      if (res.ok) setTestReply(data.reply);
      else        setTestErr(data.message || 'Test failed');
    } catch { setTestErr('Network error'); }
    setTesting(false);
  };

  if (loading) return <div className="p-8 text-sm text-zinc-500">Loading…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-white">AI Auto Responder</h2>
        {/* master enable toggle */}
        <button onClick={() => setCfg(c => ({ ...c, isEnabled: !c.isEnabled }))}
          className={`relative w-11 h-6 rounded-full transition-colors ${cfg.isEnabled ? 'bg-green-400' : 'bg-zinc-600'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${cfg.isEnabled ? 'translate-x-5' : ''}`} />
        </button>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        When no Quick Reply keyword matches, the AI answers using your company context — powered by OpenRouter.
      </p>

      <Banner type={msg?.ok ? 'success' : 'error'} msg={msg?.text} />

      {!hasApiKey && (
        <div className="bg-amber-400/10 border border-amber-400/20 text-amber-300 text-sm rounded-xl px-4 py-3 mb-5">
          ⚠️ No <span className="font-mono font-semibold">OPENROUTER_API_KEY</span> in your vault. Add it under{' '}
          <a href="/dashboard/vault" className="underline font-semibold hover:text-amber-200">Credential Management</a>{' '}
          to enable AI replies. Get a key at{' '}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="underline">openrouter.ai/keys</a>.
        </div>
      )}

      <form onSubmit={save} className="space-y-5">
        {/* System prompt */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Company System Prompt <span className="text-red-400">*</span>
          </label>
          <textarea
            value={cfg.systemPrompt}
            onChange={e => setCfg(c => ({ ...c, systemPrompt: e.target.value }))}
            rows={9}
            placeholder={`Describe your company so the AI can answer as you.\n\nExample:\nYou are the support assistant for "Acme Coffee", a specialty coffee roaster in Mumbai. We sell beans, brewing gear, and offer subscriptions. Be warm, concise, and helpful. Our hours are 9am–7pm. For order issues, ask for the order ID. Never promise refunds over ₹2000 without human approval.`}
            className="w-full px-3.5 py-3 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-400 resize-y leading-relaxed transition" />
          <p className="text-[11px] text-zinc-500 mt-1.5">This is sent as the system message on every AI reply. Saved to your account.</p>
        </div>

        {/* Model dropdown */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">OpenRouter Model</label>
          <select value={cfg.model} onChange={e => setCfg(c => ({ ...c, model: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400">
            {models.some(m => m.free) && (
              <optgroup label="Free models">
                {models.filter(m => m.free).map(m => <option key={m.id} value={m.id}>{m.label} — Free</option>)}
              </optgroup>
            )}
            {models.some(m => !m.free) && (
              <optgroup label="Paid models">
                {models.filter(m => !m.free).map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </optgroup>
            )}
          </select>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="px-5 py-2 text-sm font-semibold bg-green-400 text-zinc-900 rounded-lg hover:bg-green-300 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Test playground */}
      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Test the AI</h3>
        <p className="text-xs text-zinc-500 mb-4">Simulate an incoming message using your saved prompt, model & vault key.</p>
        <div className="flex gap-2">
          <input value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="Type a customer message…"
            className="flex-1 px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400" />
          <button onClick={runTest} disabled={testing || !hasApiKey}
            className="px-4 py-2 text-sm font-semibold bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50 transition-colors shrink-0">
            {testing ? 'Thinking…' : 'Test'}
          </button>
        </div>
        {testErr && <p className="text-xs text-red-400 mt-3">{testErr}</p>}
        {testReply && (
          <div className="mt-3 bg-green-400/5 border border-green-400/20 rounded-xl p-3.5">
            <p className="text-[10px] uppercase tracking-widest text-green-500 font-semibold mb-1.5">AI Reply</p>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{testReply}</p>
          </div>
        )}
      </div>

      {!connected && (
        <p className="text-xs text-zinc-500 mt-5">
          Note: WhatsApp is not connected. AI replies only fire on live incoming messages once you connect in the Connection tab.
        </p>
      )}
    </div>
  );
}

/* ─── MESSAGE TEMPLATES TAB (Cloud API only) ───────────── */
const TPL_LANGS = [
  { id: 'en_US', label: 'English (US)' },
  { id: 'en_GB', label: 'English (UK)' },
  { id: 'en',    label: 'English' },
  { id: 'hi',    label: 'Hindi' },
  { id: 'es',    label: 'Spanish' },
  { id: 'pt_BR', label: 'Portuguese (BR)' },
  { id: 'ar',    label: 'Arabic' },
];

const STATUS_STYLE = {
  APPROVED: 'bg-green-400/10 text-green-400 border-green-400/20',
  PENDING:  'bg-amber-400/10 text-amber-400 border-amber-400/20',
  REJECTED: 'bg-red-400/10 text-red-400 border-red-400/20',
  PAUSED:   'bg-zinc-700 text-zinc-300 border-zinc-600',
};

function TemplatesTab() {
  const BLANK = { name: '', category: 'UTILITY', language: 'en_US', header: '', body: '', footer: '' };
  const [form, setForm]       = useState(BLANK);
  const [examples, setEx]     = useState([]);
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  // Variable placeholders ({{1}}, {{2}}…) detected in the body.
  const varCount = (form.body.match(/\{\{\s*\d+\s*\}\}/g) || []).length;
  useEffect(() => {
    setEx((prev) => Array.from({ length: varCount }, (_, i) => prev[i] || ''));
  }, [varCount]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/whatsapp/cloud/templates`, { headers: h() });
      const data = await res.json();
      if (res.ok) setList(data.templates ?? []);
      else        setMsg({ ok: false, text: data.message || 'Failed to load templates' });
    } catch { setMsg({ ok: false, text: 'Network error' }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      const res  = await fetch(`${API}/whatsapp/cloud/templates`, {
        method: 'POST', headers: h(),
        body: JSON.stringify({ ...form, bodyExamples: examples }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ ok: true, text: `Submitted — status: ${data.status || 'PENDING'}` }); setForm(BLANK); setEx([]); load(); }
      else        setMsg({ ok: false, text: data.message || 'Submission failed' });
    } catch { setMsg({ ok: false, text: 'Network error' }); }
    setSaving(false);
  };

  const del = async (name) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      const res  = await fetch(`${API}/whatsapp/cloud/templates/${encodeURIComponent(name)}`, { method: 'DELETE', headers: h() });
      const data = await res.json();
      if (res.ok) load();
      else        setMsg({ ok: false, text: data.message || 'Delete failed' });
    } catch { setMsg({ ok: false, text: 'Network error' }); }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-lg font-bold text-white mb-1">Message Templates</h2>
      <p className="text-sm text-zinc-400 mb-6">Submit templates directly to Meta for approval. Use <span className="font-mono text-zinc-300">{'{{1}}'}</span>, <span className="font-mono text-zinc-300">{'{{2}}'}</span>… as variables in the body.</p>

      <Banner type={msg?.ok ? 'success' : 'error'} msg={msg?.text} />

      {/* New template form */}
      <form onSubmit={submit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-7 space-y-3">
        <h3 className="text-sm font-semibold text-white mb-1">New Template</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Name (lowercase, underscores)" value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
            placeholder="order_confirmation" required />
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category <span className="text-red-400">*</span></label>
            <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400">
              <option value="UTILITY">Utility</option>
              <option value="MARKETING">Marketing</option>
              <option value="AUTHENTICATION">Authentication</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Language</label>
          <select value={form.language} onChange={(e) => setForm(f => ({ ...f, language: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400">
            {TPL_LANGS.map(l => <option key={l.id} value={l.id}>{l.label} — {l.id}</option>)}
          </select>
        </div>

        <Input label="Header text (optional)" value={form.header} onChange={(e) => setForm(f => ({ ...f, header: e.target.value }))} placeholder="Your order is confirmed" />

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Body <span className="text-red-400">*</span></label>
          <textarea value={form.body} onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} rows={4} required
            placeholder={'Hi {{1}}, your order {{2}} has been confirmed and will ship soon.'}
            className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400 resize-y transition" />
        </div>

        {varCount > 0 && (
          <div className="space-y-2 bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-3">
            <p className="text-[11px] text-zinc-400">Example values (required by Meta for each variable):</p>
            {examples.map((v, i) => (
              <Input key={i} label={`Example for {{${i + 1}}}`} value={v}
                onChange={(e) => setEx(arr => arr.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={i === 0 ? 'Rahul' : 'ORD-001'} required />
            ))}
          </div>
        )}

        <Input label="Footer text (optional)" value={form.footer} onChange={(e) => setForm(f => ({ ...f, footer: e.target.value }))} placeholder="Reply STOP to opt out" />

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="px-5 py-2 text-sm font-semibold bg-green-400 text-zinc-900 rounded-lg hover:bg-green-300 disabled:opacity-50 transition-colors">
            {saving ? 'Submitting…' : 'Submit to Meta'}
          </button>
        </div>
      </form>

      {/* Existing templates */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Your Templates</h3>
        <button onClick={load} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : list.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No templates yet. Submit one above.</p>
      ) : (
        <div className="space-y-2">
          {list.map((t) => {
            const bodyText = t.components?.find(c => c.type === 'BODY')?.text || '';
            return (
              <div key={`${t.name}_${t.language}`} className="flex items-start gap-3 p-4 rounded-xl border bg-zinc-900 border-zinc-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-white">{t.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_STYLE[t.status] || 'bg-zinc-700 text-zinc-300 border-zinc-600'}`}>{t.status}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">{t.category}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{t.language}</span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{bodyText}</p>
                  {t.status === 'REJECTED' && t.rejected_reason && (
                    <p className="text-[11px] text-red-400 mt-1">Reason: {t.rejected_reason}</p>
                  )}
                </div>
                <button onClick={() => del(t.name)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── CONTACTS TAB ─────────────────────────────────────── */
const TAG_COLORS = ['bg-blue-400/10 text-blue-400 border-blue-400/20', 'bg-purple-400/10 text-purple-400 border-purple-400/20', 'bg-amber-400/10 text-amber-400 border-amber-400/20', 'bg-pink-400/10 text-pink-400 border-pink-400/20', 'bg-teal-400/10 text-teal-400 border-teal-400/20'];
const tagColor = (tag) => TAG_COLORS[Math.abs([...tag].reduce((a, c) => a + c.charCodeAt(0), 0)) % TAG_COLORS.length];

function TagBadge({ tag }) {
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${tagColor(tag)}`}>{tag}</span>;
}

function TagInput({ value, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim().toLowerCase().replace(/\s+/g, '_');
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  };
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tags / Categories</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((t) => (
          <span key={t} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${tagColor(t)}`}>
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="hover:opacity-60 leading-none">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Type a tag and press Enter" className="flex-1 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400" />
        <button type="button" onClick={add} className="px-3 py-2 text-sm bg-zinc-700 text-white rounded-lg hover:bg-zinc-600">Add</button>
      </div>
    </div>
  );
}

function ContactModal({ contact, onClose, onSaved }) {
  const BLANK = { phone: '', name: '', email: '', city: '', state: '', country: '', tags: [], notes: '' };
  const [form, setForm] = useState(contact ? { ...BLANK, ...contact } : BLANK);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault(); setSaving(true); setErr('');
    try {
      const url    = contact ? `${API}/whatsapp/contacts/${contact._id}` : `${API}/whatsapp/contacts`;
      const method = contact ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: h(), body: JSON.stringify(form) });
      const data   = await res.json();
      if (res.ok) { onSaved(); onClose(); }
      else        setErr(data.message || 'Save failed');
    } catch { setErr('Network error'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">{contact ? 'Edit Contact' : 'Add Contact'}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        {err && <Banner type="error" msg={err} />}
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone (with country code)" value={form.phone} onChange={f('phone')} placeholder="919876543210" required />
            <Input label="Name" value={form.name} onChange={f('name')} placeholder="Rahul Sharma" />
            <Input label="Email" value={form.email} onChange={f('email')} placeholder="rahul@example.com" />
            <Input label="City" value={form.city} onChange={f('city')} placeholder="Noida" />
            <Input label="State" value={form.state} onChange={f('state')} placeholder="UP" />
            <Input label="Country" value={form.country} onChange={f('country')} placeholder="India" />
          </div>
          <TagInput value={form.tags} onChange={(tags) => setForm((p) => ({ ...p, tags }))} />
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Any notes…"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-green-400 text-zinc-900 rounded-lg hover:bg-green-300 disabled:opacity-50">
              {saving ? 'Saving…' : contact ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [allTags, setAllTags]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [modal, setModal]       = useState(null); // null | 'add' | contact object
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const fileRef                 = useRef(null);

  const loadTags = useCallback(async () => {
    const res  = await fetch(`${API}/whatsapp/contacts/tags`, { headers: h() });
    const data = await res.json();
    setAllTags(data.tags ?? []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (search)    params.set('search', search);
      if (filterTag) params.set('tag', filterTag);
      const res  = await fetch(`${API}/whatsapp/contacts?${params}`, { headers: h() });
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setTotal(data.total ?? 0);
    } catch {} finally { setLoading(false); }
  }, [search, filterTag]);

  useEffect(() => { load(); loadTags(); }, [load, loadTags]);

  const del = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await fetch(`${API}/whatsapp/contacts/${id}`, { method: 'DELETE', headers: h() });
    load(); loadTags();
  };

  const downloadSample = () => { window.open(`${API}/whatsapp/contacts/sample.csv`); };

  const importCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportMsg(null);
    const form = new FormData(); form.append('file', file);
    try {
      const res  = await fetch(`${API}/whatsapp/contacts/import`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: form });
      const data = await res.json();
      setImportMsg({ ok: res.ok, text: data.message || (res.ok ? 'Imported' : 'Failed') });
      if (res.ok) { load(); loadTags(); }
    } catch { setImportMsg({ ok: false, text: 'Network error' }); }
    setImporting(false);
    e.target.value = '';
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Contact Details</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{total} contacts · AI auto-responder saves contact info automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadSample} className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Sample CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="px-3 py-2 text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-white border border-zinc-200 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
          <button onClick={() => setModal('add')}
            className="px-3 py-2 text-xs font-semibold text-zinc-900 bg-green-400 hover:bg-green-300 rounded-lg transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Contact
          </button>
        </div>
      </div>

      {importMsg && <Banner type={importMsg.ok ? 'success' : 'error'} msg={importMsg.text} />}

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email, city…"
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}
          className="px-3.5 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="">All Tags</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => { load(); loadTags(); }} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : contacts.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          <p>No contacts yet. Import a CSV or add manually.</p>
          <p className="text-xs mt-1 text-zinc-600">AI auto-responder will also save contact info from incoming chats.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                <th className="pb-3 pr-4 font-medium">Phone</th>
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">City / State</th>
                <th className="pb-3 pr-4 font-medium">Tags</th>
                <th className="pb-3 pr-4 font-medium">Source</th>
                <th className="pb-3 font-medium">Last Seen</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {contacts.map((c) => (
                <tr key={c._id} className="hover:bg-zinc-800/30">
                  <td className="py-3 pr-4 font-mono text-zinc-300 text-xs">{c.phone}</td>
                  <td className="py-3 pr-4 text-white">{c.name || <span className="text-zinc-600">—</span>}</td>
                  <td className="py-3 pr-4 text-zinc-400 text-xs">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                  <td className="py-3 pr-4"><div className="flex flex-wrap gap-1">{c.tags.map((t) => <TagBadge key={t} tag={t} />)}</div></td>
                  <td className="py-3 pr-4"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${c.source === 'ai' ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' : c.source === 'csv' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' : 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>{c.source}</span></td>
                  <td className="py-3 pr-4 text-zinc-500 text-xs">{c.lastSeen ? new Date(c.lastSeen).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(c)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => del(c._id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(modal === 'add' || (modal && typeof modal === 'object')) && (
        <ContactModal
          contact={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { load(); loadTags(); }}
        />
      )}
    </div>
  );
}

/* ─── CAMPAIGN TAB ──────────────────────────────────────── */
const STATUS_CLS = {
  draft:   'bg-zinc-700 text-zinc-300 border-zinc-600',
  sending: 'bg-blue-400/10 text-blue-400 border-blue-400/20 animate-pulse',
  sent:    'bg-green-400/10 text-green-400 border-green-400/20',
  failed:  'bg-red-400/10 text-red-400 border-red-400/20',
};

function CampaignModal({ campaign, allTags, onClose, onSaved }) {
  const BLANK = { name: '', message: '', targetTags: [] };
  const [form, setForm]   = useState(campaign ? { name: campaign.name, message: campaign.message, targetTags: campaign.targetTags } : BLANK);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const submit = async (ev) => {
    ev.preventDefault(); setSaving(true); setErr('');
    try {
      const url    = campaign ? `${API}/whatsapp/campaigns/${campaign._id}` : `${API}/whatsapp/campaigns`;
      const method = campaign ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: h(), body: JSON.stringify(form) });
      const data   = await res.json();
      if (res.ok) { onSaved(); onClose(); }
      else        setErr(data.message || 'Save failed');
    } catch { setErr('Network error'); }
    setSaving(false);
  };

  const toggleTag = (tag) => {
    setForm((p) => ({
      ...p,
      targetTags: p.targetTags.includes(tag) ? p.targetTags.filter((t) => t !== tag) : [...p.targetTags, tag],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">{campaign ? 'Edit Campaign' : 'New Campaign'}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        {err && <Banner type="error" msg={err} />}
        <form onSubmit={submit} className="space-y-4">
          <Input label="Campaign Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Summer Sale Blast" required />

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Message <span className="text-red-400">*</span></label>
            <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={5} required
              placeholder={'Hi {{name}}! We have a special offer for you in {{city}}. Reply YES to know more!'}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400 resize-y" />
            <p className="text-[11px] text-zinc-500 mt-1">Variables: <span className="font-mono">{'{{name}}'}</span> <span className="font-mono">{'{{city}}'}</span> <span className="font-mono">{'{{phone}}'}</span> <span className="font-mono">{'{{state}}'}</span> <span className="font-mono">{'{{country}}'}</span></p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Target Audience</label>
            {allTags.length === 0 ? (
              <p className="text-xs text-zinc-500">No tags yet — campaign will send to all contacts.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {allTags.map((t) => (
                    <button key={t} type="button" onClick={() => toggleTag(t)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${form.targetTags.includes(t) ? 'bg-green-400/15 text-green-400 border-green-400/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-600">{form.targetTags.length === 0 ? 'No tags selected — all contacts will receive this' : `Sending to contacts tagged: ${form.targetTags.join(', ')}`}</p>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-green-400 text-zinc-900 rounded-lg hover:bg-green-300 disabled:opacity-50">
              {saving ? 'Saving…' : campaign ? 'Update' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CampaignTab({ connected }) {
  const [campaigns, setCampaigns]   = useState([]);
  const [allTags, setAllTags]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [modal, setModal]           = useState(null);
  const [sending, setSending]       = useState({});
  const [sendMsg, setSendMsg]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, tr] = await Promise.all([
        fetch(`${API}/whatsapp/campaigns`, { headers: h() }).then((r) => r.json()),
        fetch(`${API}/whatsapp/contacts/tags`, { headers: h() }).then((r) => r.json()),
      ]);
      setCampaigns(cr.campaigns ?? []);
      setAllTags(tr.tags ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    await fetch(`${API}/whatsapp/campaigns/${id}`, { method: 'DELETE', headers: h() });
    load();
  };

  const send = async (campaign) => {
    if (!confirm(`Send "${campaign.name}" to ${campaign.targetTags.length ? `contacts tagged [${campaign.targetTags.join(', ')}]` : 'ALL contacts'}? This cannot be undone.`)) return;
    setSending((p) => ({ ...p, [campaign._id]: true })); setSendMsg(null);
    try {
      const res  = await fetch(`${API}/whatsapp/campaigns/${campaign._id}/send`, { method: 'POST', headers: h() });
      const data = await res.json();
      setSendMsg({ ok: res.ok, text: data.message || (res.ok ? 'Sending…' : 'Failed') });
      if (res.ok) setTimeout(load, 3000); // reload after a moment to show status
    } catch { setSendMsg({ ok: false, text: 'Network error' }); }
    setSending((p) => ({ ...p, [campaign._id]: false }));
  };

  if (!connected) return <NotConnected />;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Campaigns</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Bulk-send personalised WhatsApp messages to contact groups</p>
        </div>
        <button onClick={() => setModal('new')} className="px-4 py-2 text-sm font-semibold bg-green-400 text-zinc-900 rounded-xl hover:bg-green-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Campaign
        </button>
      </div>

      {sendMsg && <Banner type={sendMsg.ok ? 'success' : 'error'} msg={sendMsg.text} />}

      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : campaigns.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">No campaigns yet. Create one to bulk-message your contacts.</div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-white">{c.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_CLS[c.status] || STATUS_CLS.draft}`}>{c.status}</span>
                    {c.targetTags.length > 0
                      ? c.targetTags.map((t) => <TagBadge key={t} tag={t} />)
                      : <span className="text-[10px] text-zinc-600">All contacts</span>}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{c.message}</p>
                  {c.status === 'sent' && (
                    <p className="text-[11px] text-zinc-500 mt-1.5">
                      {c.totalSent} sent · {c.totalFailed} failed · {new Date(c.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {c.status === 'draft' && (
                    <>
                      <button onClick={() => setModal(c)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => send(c)} disabled={sending[c._id]}
                        className="px-3 py-1.5 text-xs font-semibold bg-green-400 text-zinc-900 rounded-lg hover:bg-green-300 disabled:opacity-50 flex items-center gap-1">
                        {sending[c._id] ? <><span className="w-3 h-3 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" />Sending…</> : <>▶ Send</>}
                      </button>
                      <button onClick={() => del(c._id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CampaignModal
          campaign={modal === 'new' ? null : modal}
          allTags={allTags}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

/* ─── COMING SOON ──────────────────────────────────────── */
function ComingSoon({ label }) {
  return (
    <div className="p-8 max-w-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-400/10 text-green-400 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h3 className="text-lg font-bold text-white">{label}</h3>
        <p className="text-sm text-zinc-400 mt-2">This feature is under development and will be available soon.</p>
      </div>
    </div>
  );
}

/* ─── ROOT ─────────────────────────────────────────────── */
export default function WhatsAppPage() {
  const [feature, setFeature] = useState('send');
  const [conn, setConn]       = useState({ mode: 'qr', status: 'disconnected', qrBase64: null, phone: null, error: null, cloud: {} });
  const pollRef               = useRef(null);

  const fetchConn = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/whatsapp/connection`, { headers: h() });
      const data = await res.json();
      setConn(data);
      return data.status;
    } catch { return null; }
  }, []);

  // On mount, load the unified connection state
  useEffect(() => { fetchConn(); }, [fetchConn]);

  // Poll while a QR session is connecting/waiting for scan
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (conn.mode === 'qr' && ['qr', 'connecting'].includes(conn.status)) {
      pollRef.current = setInterval(fetchConn, 2500);
    } else if (conn.status === 'connected') {
      pollRef.current = setInterval(fetchConn, 20_000); // slow heartbeat
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conn.mode, conn.status, fetchConn]);

  const connected = conn.status === 'connected';
  const cloudConnected = conn.mode === 'cloud' && !!conn.cloud?.verified;
  const visibleFeatures = FEATURES.filter((f) => !f.cloudOnly || cloudConnected);

  // If the active tab becomes hidden (e.g. cloud disconnected), fall back to Send.
  useEffect(() => {
    if (!visibleFeatures.some((f) => f.key === feature)) setFeature('send');
  }, [visibleFeatures, feature]);

  /* status pill */
  const pill = {
    connected:    { cls: 'bg-green-400/10 text-green-400 border-green-400/20',  dot: 'bg-green-400',  label: 'Connected' },
    qr:           { cls: 'bg-amber-400/10 text-amber-400 border-amber-400/20',  dot: 'bg-amber-400 animate-pulse', label: 'Scan QR' },
    connecting:   { cls: 'bg-blue-400/10  text-blue-400  border-blue-400/20',   dot: 'bg-blue-400 animate-pulse',  label: 'Connecting…' },
    disconnected: { cls: 'bg-zinc-800 text-zinc-400 border-zinc-700',           dot: 'bg-zinc-500',   label: 'Disconnected' },
    error:        { cls: 'bg-red-400/10 text-red-400 border-red-400/20',        dot: 'bg-red-400',    label: 'Error' },
  }[conn.status] ?? { cls: 'bg-zinc-800 text-zinc-400 border-zinc-700', dot: 'bg-zinc-500', label: conn.status };

  return (
    <div className="flex min-h-full">
      {/* Feature sidebar */}
      <aside className="w-52 shrink-0 border-r border-zinc-800 bg-zinc-900/40 flex flex-col">
        {/* WhatsApp header + status */}
        <div className="px-4 pt-5 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.878-1.42A9.945 9.945 0 0011.999 22C17.522 22 22 17.523 22 12S17.522 2 11.999 2z"/>
            </svg>
            <span className="text-sm font-bold text-white">WhatsApp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${pill.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
              {pill.label}
            </div>
            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
              {conn.mode === 'cloud' ? 'API' : 'QR'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {visibleFeatures.map((f) => {
            const active = feature === f.key;
            return (
              <button key={f.key} onClick={() => setFeature(f.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors text-left border-r-2 ${
                  active
                    ? 'bg-green-400/10 text-green-400 border-green-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border-transparent'
                }`}>
                {f.icon}
                <span className="truncate">{f.label}</span>
                {COMING_SOON.includes(f.key) && (
                  <span className="ml-auto text-[9px] font-semibold text-zinc-600 shrink-0">SOON</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {feature === 'send'          && <SendTab connected={connected} />}
        {feature === 'inbox'         && <InboxTab connected={connected} />}
        {feature === 'contacts'      && <ContactsTab />}
        {feature === 'campaign'      && <CampaignTab connected={connected} />}
        {feature === 'autoresponder' && <AutoResponderTab connected={connected} />}
        {feature === 'ecommerce'     && <EcommerceTab connected={connected} />}
        {feature === 'ai'            && <AITab connected={connected} />}
        {feature === 'templates'     && <TemplatesTab />}
        {feature === 'chatbot'       && <ComingSoon label="Chatbot (Workflow)" />}
        {feature === 'form'          && <ComingSoon label="Form Creation" />}
      </div>
    </div>
  );
}
