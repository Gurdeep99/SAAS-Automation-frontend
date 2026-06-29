'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

function authHdr() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'comments', label: 'Comment Auto-Reply' },
  { key: 'schedule', label: 'Schedule Post' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const STATUS_CLS = {
  scheduled: 'bg-zinc-700 text-zinc-300',
  posted:    'bg-green-500/20 text-green-400',
  failed:    'bg-red-500/20 text-red-400',
};

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-sm">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500';

// ── Calendar Tab ──────────────────────────────────────────────────────────────

function CalendarTab({ onNewPost }) {
  const now   = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [posts, setPosts] = useState([]);
  const [detail, setDetail] = useState(null);

  const fetchCal = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/instagram/calendar?year=${year}&month=${month}`, { headers: authHdr() });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {}
  }, [year, month]);

  useEffect(() => { fetchCal(); }, [fetchCal]);

  function prev() { month === 1 ? (setYear(y => y - 1), setMonth(12)) : setMonth(m => m - 1); }
  function next() { month === 12 ? (setYear(y => y + 1), setMonth(1))  : setMonth(m => m + 1); }

  const firstDay    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  function dayPosts(d) {
    return posts.filter(p => {
      const dt = new Date(p.scheduledAt);
      return dt.getFullYear() === year && dt.getMonth() + 1 === month && dt.getDate() === d;
    });
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const todayYear  = now.getFullYear();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h2 className="text-base font-semibold min-w-[160px] text-center">{MONTHS[month - 1]} {year}</h2>
          <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <button onClick={onNewPost} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Schedule Post
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />Post</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />Story</span>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-zinc-500 py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} className="min-h-[72px]" />;
          const dp  = dayPosts(day);
          const isToday = day === todayDay && month === todayMonth && year === todayYear;
          return (
            <div
              key={day}
              onClick={() => dp.length > 0 && setDetail({ day, posts: dp })}
              className={`min-h-[72px] rounded-xl p-1.5 border transition-colors ${
                isToday ? 'border-pink-500/60 bg-pink-500/5' : 'border-zinc-800 hover:border-zinc-600'
              } ${dp.length > 0 ? 'cursor-pointer' : ''}`}
            >
              <div className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full mb-1 ${
                isToday ? 'bg-pink-500 text-white' : 'text-zinc-400'
              }`}>{day}</div>
              <div className="space-y-0.5">
                {dp.slice(0, 2).map(p => (
                  <div key={p._id} className={`text-[10px] rounded px-1 py-0.5 truncate leading-tight ${
                    p.type === 'story' ? 'bg-purple-500/30 text-purple-300' : 'bg-pink-500/30 text-pink-300'
                  }`}>
                    {new Date(p.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
                {dp.length > 2 && <div className="text-[10px] text-zinc-500">+{dp.length - 2}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day detail */}
      {detail && (
        <div className="mt-5 bg-zinc-800/60 rounded-xl p-4 border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{MONTHS[month - 1]} {detail.day}</span>
            <button onClick={() => setDetail(null)} className="text-zinc-500 hover:text-white text-sm">✕</button>
          </div>
          <div className="space-y-2">
            {detail.posts.map(p => (
              <div key={p._id} className="flex items-center gap-3 bg-zinc-900 rounded-lg p-3">
                {p.mediaUrl && !p.mediaUrl.startsWith('data:') && (
                  <img src={p.mediaUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{p.type}</p>
                  <p className="text-xs text-zinc-400 truncate">{p.caption || '(no caption)'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-zinc-400">{new Date(p.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_CLS[p.status] || STATUS_CLS.scheduled}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Comment Rules Tab ─────────────────────────────────────────────────────────

const EMPTY_RULE = { name: '', mediaId: '', mediaUrl: '', triggerKeywords: '', replyText: '', isActive: true };

function CommentsTab() {
  const [rules, setRules]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | 'add' | rule object
  const [form, setForm]       = useState(EMPTY_RULE);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/instagram/comment-rules`, { headers: authHdr() });
      const data = await res.json();
      setRules(data.rules || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  function openAdd() { setForm(EMPTY_RULE); setErr(''); setModal('add'); }
  function openEdit(r) {
    setForm({ ...r, triggerKeywords: (r.triggerKeywords || []).join(', ') });
    setErr('');
    setModal(r);
  }

  async function save() {
    setSaving(true); setErr('');
    const body = {
      ...form,
      triggerKeywords: form.triggerKeywords.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      const isEdit = modal && modal._id;
      const res = await fetch(
        `${API}/instagram/comment-rules${isEdit ? `/${modal._id}` : ''}`,
        { method: isEdit ? 'PUT' : 'POST', headers: authHdr(), body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) { setErr(data.message || 'Error'); setSaving(false); return; }
      setModal(null);
      fetchRules();
    } catch (e) { setErr(e.message); }
    setSaving(false);
  }

  async function toggleActive(r) {
    await fetch(`${API}/instagram/comment-rules/${r._id}`, {
      method: 'PUT', headers: authHdr(),
      body: JSON.stringify({ ...r, triggerKeywords: r.triggerKeywords, isActive: !r.isActive }),
    });
    fetchRules();
  }

  async function del(id) {
    if (!confirm('Delete this rule?')) return;
    await fetch(`${API}/instagram/comment-rules/${id}`, { method: 'DELETE', headers: authHdr() });
    fetchRules();
  }

  const RuleForm = (
    <div className="space-y-4">
      <Field label="Rule Name">
        <input className={inputCls} placeholder="e.g. Giveaway replies" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </Field>
      <Field label="Instagram Media ID (post/reel)">
        <input className={inputCls} placeholder="17841400..." value={form.mediaId} onChange={e => setForm(f => ({ ...f, mediaId: e.target.value }))} />
        <p className="text-[11px] text-zinc-500 mt-1">Find it in your Instagram Graph API or post URL.</p>
      </Field>
      <Field label="Post URL (optional, for reference)">
        <input className={inputCls} placeholder="https://www.instagram.com/p/..." value={form.mediaUrl} onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))} />
      </Field>
      <Field label="Trigger Keywords (comma-separated, leave empty = reply to all)">
        <input className={inputCls} placeholder="link, price, where" value={form.triggerKeywords} onChange={e => setForm(f => ({ ...f, triggerKeywords: e.target.value }))} />
      </Field>
      <Field label="Reply Text">
        <textarea className={`${inputCls} h-24 resize-none`} placeholder="Thanks! DM us for more info." value={form.replyText} onChange={e => setForm(f => ({ ...f, replyText: e.target.value }))} />
      </Field>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-sm font-medium text-white transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : modal?._id ? 'Update Rule' : 'Add Rule'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold">Comment Auto-Reply</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Automatically reply to comments on targeted posts/reels</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Add Rule
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">Loading…</div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-zinc-500 gap-2">
          <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p className="text-sm">No comment rules yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(r => (
            <div key={r._id} className="bg-zinc-800/60 rounded-xl border border-zinc-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{r.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                      {r.isActive ? 'Active' : 'Paused'}
                    </span>
                    <span className="text-[10px] text-zinc-500">{r.replyCount} replies</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">Media: <span className="font-mono text-zinc-300">{r.mediaId}</span></p>
                  {r.triggerKeywords?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {r.triggerKeywords.map((k, i) => (
                        <span key={i} className="text-[11px] bg-zinc-700 text-zinc-300 rounded px-2 py-0.5">{k}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 mb-2">Triggers on all comments</p>
                  )}
                  <p className="text-xs text-zinc-300 bg-zinc-900 rounded-lg px-3 py-2 italic">"{r.replyText}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(r)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${r.isActive ? 'bg-pink-600' : 'bg-zinc-700'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${r.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button onClick={() => del(r._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <Modal title={modal?._id ? 'Edit Rule' : 'Add Comment Rule'} onClose={() => setModal(null)}>
          {RuleForm}
        </Modal>
      )}
    </div>
  );
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────

const EMPTY_POST = { type: 'post', mediaUrl: '', caption: '', scheduledAt: '' };

function ScheduleTab({ onPostSaved }) {
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY_POST);
  const [previewSrc, setPreview]  = useState('');
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');
  const [success, setSuccess]     = useState('');
  const fileRef                   = useRef(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/instagram/posts`, { headers: authHdr() });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setForm(f => ({ ...f, mediaUrl: ev.target.result }));
    };
    reader.readAsDataURL(file);
  }

  function handleUrlInput(val) {
    setForm(f => ({ ...f, mediaUrl: val }));
    setPreview(val);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setErr(''); setSuccess('');
    try {
      const res  = await fetch(`${API}/instagram/posts`, {
        method: 'POST', headers: authHdr(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || 'Error'); setSaving(false); return; }
      setSuccess('Post scheduled!');
      setForm(EMPTY_POST); setPreview('');
      fetchPosts();
      onPostSaved?.();
    } catch (e) { setErr(e.message); }
    setSaving(false);
  }

  async function del(id) {
    if (!confirm('Delete this scheduled post?')) return;
    await fetch(`${API}/instagram/posts/${id}`, { method: 'DELETE', headers: authHdr() });
    fetchPosts();
  }

  const isStory = form.type === 'story';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Form */}
      <div>
        <h2 className="font-semibold mb-5">Create Scheduled Content</h2>
        <form onSubmit={submit} className="space-y-4">
          {/* Type toggle */}
          <Field label="Content Type">
            <div className="flex gap-1 bg-zinc-800 rounded-xl p-1">
              {['post', 'story'].map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    form.type === t ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {/* Media */}
          <Field label="Media">
            <div className="space-y-2">
              <input
                className={inputCls}
                placeholder="Paste image/video URL…"
                value={form.mediaUrl.startsWith('data:') ? '' : form.mediaUrl}
                onChange={e => handleUrlInput(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-xs text-zinc-500">or</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border border-dashed border-zinc-600 hover:border-pink-500 rounded-xl py-3 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Upload from device
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
            </div>
          </Field>

          {/* Caption */}
          <Field label={isStory ? 'Caption / Overlay Text' : 'Caption'}>
            <textarea
              className={`${inputCls} h-24 resize-none`}
              placeholder={isStory ? 'Text shown on the story…' : 'Write a caption…'}
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
            />
          </Field>

          {/* Schedule time */}
          <Field label="Schedule Date & Time">
            <input
              type="datetime-local"
              className={inputCls}
              value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              required
            />
          </Field>

          {err     && <p className="text-xs text-red-400">{err}</p>}
          {success && <p className="text-xs text-green-400">{success}</p>}

          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-medium text-sm transition-all disabled:opacity-50">
            {saving ? 'Scheduling…' : `Schedule ${form.type === 'story' ? 'Story' : 'Post'}`}
          </button>
        </form>
      </div>

      {/* Right: Preview */}
      <div>
        <h2 className="font-semibold mb-5">Preview</h2>
        {isStory ? (
          /* Story: 9:16 phone frame */
          <div className="flex justify-center">
            <div className="relative" style={{ width: 200 }}>
              {/* Phone shell */}
              <div className="rounded-[32px] border-4 border-zinc-600 overflow-hidden bg-zinc-900 shadow-2xl" style={{ aspectRatio: '9/16' }}>
                {previewSrc ? (
                  <img src={previewSrc} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span className="text-xs text-center px-4">Story preview</span>
                  </div>
                )}
                {/* Caption overlay */}
                {form.caption && (
                  <div className="absolute bottom-10 left-0 right-0 px-3">
                    <p className="text-white text-xs font-semibold text-center drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{form.caption}</p>
                  </div>
                )}
                {/* Progress bar */}
                <div className="absolute top-3 left-3 right-3 h-0.5 bg-white/30 rounded-full">
                  <div className="h-full w-1/3 bg-white rounded-full" />
                </div>
                {/* Avatar placeholder */}
                <div className="absolute top-6 left-3 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                  <span className="text-white text-[9px] font-medium">your_page</span>
                </div>
              </div>
              {/* Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-700 rounded-full" />
            </div>
          </div>
        ) : (
          /* Post: square frame */
          <div className="flex justify-center">
            <div className="w-[260px]">
              {/* Instagram-style post card */}
              <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                  <span className="text-xs font-medium">your_page</span>
                </div>
                {/* Image */}
                <div className="aspect-square bg-zinc-900">
                  {previewSrc ? (
                    <img src={previewSrc} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-600">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <span className="text-xs">Post preview</span>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="px-3 pt-2 pb-1 flex items-center gap-3">
                  <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                  <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                </div>
                {/* Caption */}
                <div className="px-3 pb-3">
                  {form.caption ? (
                    <p className="text-xs text-zinc-200 line-clamp-3">
                      <span className="font-medium mr-1">your_page</span>{form.caption}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-600 italic">Caption will appear here…</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled time badge */}
        {form.scheduledAt && (
          <div className="flex justify-center mt-4">
            <span className="flex items-center gap-1.5 text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {new Date(form.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        )}
      </div>

      {/* Scheduled list — spans full width */}
      <div className="lg:col-span-2 mt-2">
        <h3 className="font-semibold text-sm mb-3 text-zinc-300">Upcoming Scheduled Content</h3>
        {loading ? (
          <div className="text-sm text-zinc-500 text-center py-6">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-8 border border-dashed border-zinc-800 rounded-xl">
            No scheduled content yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {posts.map(p => (
              <div key={p._id} className="bg-zinc-800/60 border border-zinc-700 rounded-xl overflow-hidden">
                {/* Thumbnail */}
                {p.mediaUrl && !p.mediaUrl.startsWith('data:') ? (
                  <div className="aspect-video bg-zinc-900">
                    <img src={p.mediaUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-zinc-900 flex items-center justify-center text-zinc-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-medium ${p.type === 'story' ? 'bg-purple-500/20 text-purple-300' : 'bg-pink-500/20 text-pink-300'}`}>
                      {p.type}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_CLS[p.status] || STATUS_CLS.scheduled}`}>{p.status}</span>
                  </div>
                  <p className="text-xs text-zinc-300 truncate">{p.caption || '(no caption)'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-zinc-500">
                      {new Date(p.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <button onClick={() => del(p._id)} className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstagramAutomationPage() {
  const [feature, setFeature] = useState('calendar');

  function goSchedule() { setFeature('schedule'); }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Instagram Automation</h1>
            <p className="text-sm text-zinc-400">Schedule posts, auto-reply to comments, manage your calendar</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-6">
          {FEATURES.map(f => (
            <button
              key={f.key}
              onClick={() => setFeature(f.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                feature === f.key
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          {feature === 'calendar' && <CalendarTab onNewPost={goSchedule} />}
          {feature === 'comments' && <CommentsTab />}
          {feature === 'schedule' && <ScheduleTab onPostSaved={() => {}} />}
        </div>
      </div>
    </div>
  );
}
