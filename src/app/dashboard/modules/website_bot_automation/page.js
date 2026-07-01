'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API     = process.env.NEXT_PUBLIC_API_URL;
const API_PUB = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function authHdr() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
}

const TABS = [
  { key: 'embed',         label: 'Embed Code' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'settings',      label: 'Settings' },
];

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500';

// ── Widget Preview (live mock) ────────────────────────────────────────────────

function WidgetPreview({ cfg }) {
  return (
    <div className="flex flex-col items-end gap-4">
      {/* Panel */}
      <div className="w-[280px] bg-zinc-900 rounded-2xl border border-zinc-700 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-zinc-800 border-b border-zinc-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-base overflow-hidden shrink-0">
            {cfg.botImage
              ? <img src={cfg.botImage} className="w-full h-full object-cover" alt="" />
              : '🤖'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-100 truncate">{cfg.botName || 'Assistant'}</p>
            <p className="text-[10px] text-green-400">● Online</p>
          </div>
          <span className="text-zinc-500 text-lg leading-none">✕</span>
        </div>

        {/* Messages */}
        <div className="p-3 flex flex-col gap-2 bg-zinc-950/50" style={{ minHeight: 180 }}>
          {/* Bot greeting */}
          <div className="flex items-end gap-1.5 max-w-[85%]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs shrink-0 overflow-hidden">
              {cfg.botImage ? <img src={cfg.botImage} className="w-full h-full object-cover" alt="" /> : '🤖'}
            </div>
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-zinc-200 leading-relaxed">
              {cfg.greetingMessage || 'Hi! How can I help you today?'}
            </div>
          </div>
          {/* User example */}
          <div className="flex items-end gap-1.5 max-w-[80%] self-end flex-row-reverse">
            <div className="bg-gradient-to-br from-violet-600 to-blue-600 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white">
              Tell me more about this
            </div>
          </div>
          {/* Bot reply */}
          <div className="flex items-end gap-1.5 max-w-[85%]">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs shrink-0 overflow-hidden">
              {cfg.botImage ? <img src={cfg.botImage} className="w-full h-full object-cover" alt="" /> : '🤖'}
            </div>
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-zinc-200 leading-relaxed">
              Sure! I'd be happy to explain…
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900 border-t border-zinc-700">
          <div className="flex-1 bg-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-500">Type a message…</div>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </div>
        </div>
        <div className="text-center text-[9px] text-zinc-700 py-1.5">Powered by EdyyoBot</div>
      </div>

      {/* Float button */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-900/40 overflow-hidden">
        {cfg.botImage
          ? <img src={cfg.botImage} className="w-full h-full object-cover" alt="" />
          : <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        }
      </div>
    </div>
  );
}

// ── Embed Code Tab ────────────────────────────────────────────────────────────

const LANG_TABS = ['HTML', 'Next.js', 'React', 'Vue', 'WordPress'];

function EmbedTab({ userId, cfg }) {
  const [lang, setLang]       = useState('HTML');
  const [copied, setCopied]   = useState(false);
  const widgetSrc = `${API_PUB}/widget.js`;

  const snippets = {
    'HTML': `<!-- Paste before </body> or in <head> -->
<script
  src="${widgetSrc}"
  data-user-id="${userId || 'YOUR_USER_ID'}"
  defer
></script>`,

    'Next.js': `// In your layout.js or _app.js
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${widgetSrc}"
          data-user-id="${userId || 'YOUR_USER_ID'}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`,

    'React': `// In your App.jsx or index.jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${widgetSrc}';
    script.setAttribute('data-user-id', '${userId || 'YOUR_USER_ID'}');
    script.defer = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  return <div>{/* your app */}</div>;
}`,

    'Vue': `// In your main.js or App.vue mounted()
mounted() {
  const script = document.createElement('script');
  script.src = '${widgetSrc}';
  script.setAttribute('data-user-id', '${userId || 'YOUR_USER_ID'}');
  script.defer = true;
  document.body.appendChild(script);
}`,

    'WordPress': `// Add to your theme's functions.php
function add_website_bot() {
  wp_register_script(
    'EdyyoBot-widget',
    '${widgetSrc}',
    array(), null, true
  );
  wp_enqueue_script('EdyyoBot-widget');
  add_filter('script_loader_tag', function($tag, $handle) {
    if ($handle !== 'EdyyoBot-widget') return $tag;
    return str_replace(
      '<script',
      '<script data-user-id="${userId || 'YOUR_USER_ID'}"',
      $tag
    );
  }, 10, 2);
}
add_action('wp_enqueue_scripts', 'add_website_bot');`,
  };

  function copy() {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
      <div>
        <div className="mb-4">
          <h2 className="font-semibold mb-1">Install on your website</h2>
          <p className="text-sm text-zinc-400">Paste one snippet — the chatbot appears instantly on your site.</p>
        </div>

        {/* Lang selector */}
        <div className="flex gap-1 bg-zinc-800 rounded-xl p-1 mb-3 overflow-x-auto">
          {LANG_TABS.map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                lang === l ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Code block */}
        <div className="relative">
          <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 overflow-x-auto leading-relaxed font-mono">
            {snippets[lang]}
          </pre>
          <button
            onClick={copy}
            className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
            }`}
          >
            {copied ? (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>Copied!</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy</>
            )}
          </button>
        </div>

        {/* Your User ID */}
        <div className="mt-4 bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
          <p className="text-xs text-zinc-400 mb-1 font-medium">Your User ID</p>
          <code className="text-sm text-violet-300 font-mono break-all">{userId || '— loading…'}</code>
        </div>

        {/* Key requirement note */}
        <div className="mt-4 flex gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div className="text-xs text-zinc-300 space-y-1">
            <p className="font-medium text-amber-300">OpenRouter API Key required</p>
            <p>Go to <strong>Credential Management → Add Credential</strong> and save your OpenRouter key with the name <code className="bg-zinc-800 px-1 py-0.5 rounded text-violet-300">OPENROUTER_API_KEY</code>. If you already added it for WhatsApp AI, you're all set.</p>
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Live Preview</p>
        <WidgetPreview cfg={cfg} />
      </div>
    </div>
  );
}

// ── Conversations Tab ─────────────────────────────────────────────────────────

function ConversationsTab() {
  const [sessions, setSessions]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [msgs, setMsgs]           = useState([]);
  const [loadingMsgs, setLMs]     = useState(false);
  const [search, setSearch]       = useState('');
  const msgsRef                   = useRef(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const q   = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API}/websitebot/sessions?limit=50${q}`, { headers: authHdr() });
      const d   = await res.json();
      setSessions(d.sessions || []);
      setTotal(d.total || 0);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function openSession(s) {
    setSelected(s);
    setLMs(true);
    setMsgs([]);
    try {
      const res = await fetch(`${API}/websitebot/sessions/${s.sessionId}`, { headers: authHdr() });
      const d   = await res.json();
      setMsgs(d.session?.messages || []);
    } catch {}
    setLMs(false);
    setTimeout(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, 50);
  }

  async function del(s) {
    if (!confirm('Delete this conversation?')) return;
    await fetch(`${API}/websitebot/sessions/${s.sessionId}`, { method: 'DELETE', headers: authHdr() });
    if (selected?.sessionId === s.sessionId) { setSelected(null); setMsgs([]); }
    fetchSessions();
  }

  function fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    const now = new Date();
    if (dt.toDateString() === now.toDateString()) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <div className="flex gap-4 h-[580px]">
      {/* Session list */}
      <div className="w-80 shrink-0 flex flex-col">
        <div className="mb-3">
          <input
            className={inputCls}
            placeholder="Search by page URL…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-500 gap-2">
              <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
              </svg>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : sessions.map(s => (
            <div
              key={s._id}
              onClick={() => openSession(s)}
              className={`p-3 rounded-xl cursor-pointer border transition-colors ${
                selected?.sessionId === s.sessionId
                  ? 'bg-violet-600/20 border-violet-500/40'
                  : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-mono text-zinc-300 truncate">{s.sessionId.slice(0, 10)}…</span>
                <span className="text-[10px] text-zinc-500 shrink-0 ml-2">{fmtDate(s.lastSeen)}</span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate mb-1">{s.pageUrl || '—'}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 truncate flex-1">{s.lastMessage || '…'}</p>
                <span className="ml-2 text-[10px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-full shrink-0">{s.messageCount}</span>
              </div>
            </div>
          ))}
        </div>
        {total > 0 && <p className="text-xs text-zinc-600 mt-2 text-center">{total} total sessions</p>}
      </div>

      {/* Message thread */}
      <div className="flex-1 bg-zinc-800/40 rounded-xl border border-zinc-700 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-2">
            <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
            <p className="text-sm">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800/60">
              <div>
                <p className="text-sm font-medium text-zinc-200 font-mono">{selected.sessionId.slice(0, 16)}…</p>
                <p className="text-xs text-zinc-500 truncate max-w-xs">{selected.pageUrl || 'unknown page'}</p>
              </div>
              <button onClick={() => del(selected)} className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div ref={msgsRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="text-center text-zinc-500 text-sm py-8">Loading…</div>
              ) : msgs.length === 0 ? (
                <div className="text-center text-zinc-600 text-sm py-8">No messages</div>
              ) : msgs.map((m, i) => {
                const isBot = m.role === 'assistant';
                return (
                  <div key={i} className={`flex items-end gap-2 max-w-[80%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}>
                    {isBot && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs shrink-0">🤖</div>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isBot ? 'bg-zinc-700 text-zinc-200 rounded-bl-sm' : 'bg-violet-600 text-white rounded-br-sm'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

const DEFAULT_CFG = {
  botName: 'Assistant', botImage: '', greetingMessage: 'Hi! How can I help you today?',
  companyInfo: '', model: '', autoExpand: false, isActive: true,
};

function SettingsTab({ onSaved }) {
  const [form, setForm]       = useState(DEFAULT_CFG);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [err, setErr]         = useState('');
  const [models, setModels]   = useState([]);

  useEffect(() => {
    fetch(`${API}/websitebot/config`, { headers: authHdr() })
      .then(r => r.json())
      .then(d => { if (d.config) setForm({ ...DEFAULT_CFG, ...d.config }); })
      .catch(() => {});
    fetch(`${API}/websitebot/models`, { headers: authHdr() })
      .then(r => r.json())
      .then(d => { if (d.models) setModels(d.models); })
      .catch(() => {});
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErr(''); setSaved(false);
    try {
      const res = await fetch(`${API}/websitebot/config`, {
        method: 'PUT', headers: authHdr(), body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.message || 'Error'); setSaving(false); return; }
      setForm({ ...DEFAULT_CFG, ...d.config });
      setSaved(true);
      onSaved?.({ ...DEFAULT_CFG, ...d.config });
    } catch (e) { setErr(e.message); }
    setSaving(false);
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
      <form onSubmit={save} className="space-y-5 max-w-lg">
        <h2 className="font-semibold">Bot Configuration</h2>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Bot Name</label>
          <input className={inputCls} placeholder="Assistant" value={form.botName}
            onChange={e => set('botName', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Bot Avatar URL</label>
          <input className={inputCls} placeholder="https://…/avatar.png" value={form.botImage}
            onChange={e => set('botImage', e.target.value)} />
          {form.botImage && (
            <img src={form.botImage} alt="avatar" className="w-10 h-10 rounded-full object-cover mt-1 border border-zinc-700" />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Greeting Message</label>
          <input className={inputCls} placeholder="Hi! How can I help you today?" value={form.greetingMessage}
            onChange={e => set('greetingMessage', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">AI Model</label>
          <select
            className={`${inputCls} cursor-pointer`}
            value={form.model}
            onChange={e => set('model', e.target.value)}
          >
            <option value="">Default (Llama 3.3 70B free)</option>
            {models.length > 0 && (
              <>
                <optgroup label="── Free Models ──">
                  {models.filter(m => m.free).map(m => (
                    <option key={m.id} value={m.id}>{m.label} ✦ free</option>
                  ))}
                </optgroup>
                <optgroup label="── Paid Models ──">
                  {models.filter(m => !m.free).map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
          <p className="text-[11px] text-zinc-500">Free models have rate limits. Paid models require OpenRouter credits but are faster and more reliable.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Company / Product Info</label>
          <textarea
            className={`${inputCls} h-40 resize-none`}
            placeholder={`Describe your business, products, and services.\n\nExample:\nWe are Acme Corp, selling eco-friendly water bottles.\nProducts: AquaMax Pro ($29), HydroLite ($19).\nShipping: Free over $50. Returns: 30 days.`}
            value={form.companyInfo}
            onChange={e => set('companyInfo', e.target.value)}
          />
          <p className="text-[11px] text-zinc-500">This becomes the AI's system prompt — the more detail, the better answers.</p>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-y border-zinc-800">
            <div>
              <p className="text-sm font-medium">Auto-Expand</p>
              <p className="text-xs text-zinc-500">Widget opens automatically 1.5s after page load</p>
            </div>
            <button
              type="button"
              onClick={() => set('autoExpand', !form.autoExpand)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${form.autoExpand ? 'bg-violet-600' : 'bg-zinc-700'}`}
              style={{ height: 22, width: 40 }}
            >
              <span className={`absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${form.autoExpand ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-zinc-500">Disable to hide the widget from your site without removing the code</p>
            </div>
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={`relative rounded-full transition-colors ${form.isActive ? 'bg-green-600' : 'bg-zinc-700'}`}
              style={{ height: 22, width: 40 }}
            >
              <span className={`absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {err  && <p className="text-xs text-red-400">{err}</p>}
        {saved && <p className="text-xs text-green-400">Settings saved!</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium text-sm transition-all disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>

        {/* OpenRouter reminder */}
        <div className="flex gap-3 bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
          <svg className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          <p className="text-xs text-zinc-400">
            Save your OpenRouter API key in{' '}
            <a href="/dashboard/vault" className="text-violet-400 hover:underline">Credential Management</a>{' '}
            under the name <code className="bg-zinc-700 px-1 py-0.5 rounded text-violet-300">OPENROUTER_API_KEY</code>{' '}
            (same key used by WhatsApp AI — no need to add it twice).
          </p>
        </div>
      </form>

      {/* Live preview */}
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Live Preview</p>
        <WidgetPreview cfg={form} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WebsiteBotPage() {
  const [tab, setTab]         = useState('embed');
  const [userId, setUserId]   = useState('');
  const [cfg, setCfg]         = useState(DEFAULT_CFG);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    // Fetch profile to get user ID for embed snippet
    fetch(`${API}/user/profile`, { headers: authHdr() })
      .then(r => r.json())
      .then(d => { if (d.user?._id) setUserId(d.user._id); })
      .catch(() => {});
    // Fetch current config for preview
    fetch(`${API}/websitebot/config`, { headers: authHdr() })
      .then(r => r.json())
      .then(d => { if (d.config) setCfg({ ...DEFAULT_CFG, ...d.config }); })
      .catch(() => {});
  }, []);

  async function toggleActive() {
    if (toggling) return;
    const next = !cfg.isActive;
    setToggling(true);
    // Optimistic update
    setCfg(c => ({ ...c, isActive: next }));
    try {
      const res = await fetch(`${API}/websitebot/config`, {
        method: 'PUT',
        headers: authHdr(),
        body: JSON.stringify({ ...cfg, isActive: next }),
      });
      const d = await res.json();
      if (d.config) setCfg(c => ({ ...c, ...d.config }));
    } catch {
      // Revert on failure
      setCfg(c => ({ ...c, isActive: !next }));
    }
    setToggling(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Website Bot</h1>
            <p className="text-sm text-zinc-400">One script tag — full AI chatbot on any website</p>
          </div>

          {/* Quick on/off toggle */}
          <button
            onClick={toggleActive}
            disabled={toggling}
            title={cfg.isActive ? 'Click to hide bot from website' : 'Click to show bot on website'}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all disabled:opacity-60 ${
              cfg.isActive
                ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {toggling ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <span className={`w-2 h-2 rounded-full ${cfg.isActive ? 'bg-green-400' : 'bg-zinc-500'}`} />
            )}
            {cfg.isActive ? 'Live on website' : 'Hidden from website'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          {tab === 'embed'         && <EmbedTab userId={userId} cfg={cfg} />}
          {tab === 'conversations' && <ConversationsTab />}
          {tab === 'settings'      && <SettingsTab onSaved={c => setCfg({ ...DEFAULT_CFG, ...c })} />}
        </div>
      </div>
    </div>
  );
}
