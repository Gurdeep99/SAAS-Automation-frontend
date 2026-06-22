'use client';

import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL;

const MODULE_META = {
  instagram_automation: {
    label: 'Instagram Automation', color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20',
    icon: <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    description: 'Auto-follow, schedule posts, manage DMs, and grow your Instagram presence automatically.',
    features: ['Post scheduling', 'Auto-follow / unfollow', 'Comment automation', 'DM campaigns', 'Hashtag targeting'],
  },
  blogs_automation: {
    label: 'Blogs Automation', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20',
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    description: 'AI-powered blog generation, SEO optimization, scheduling, and multi-platform publishing.',
    features: ['AI blog generation', 'SEO optimization', 'Multi-platform publishing', 'Content scheduling', 'Analytics dashboard'],
  },
  gmb_automation: {
    label: 'Google My Business', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20',
    icon: <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>,
    description: 'Auto-post updates, respond to reviews, manage Q&A, and track GMB insights.',
    features: ['Auto post updates', 'Review reply automation', 'Q&A management', 'Business insights tracking', 'Photo & offer scheduling'],
  },
};

export default function ModulePage() {
  const { key } = useParams();
  const meta = MODULE_META[key];

  if (!meta) {
    return <div className="p-8 text-zinc-400">Module not found.</div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-5 mb-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.color} border ${meta.border}`}>
          {meta.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{meta.label}</h1>
          <p className="mt-1 text-sm text-zinc-400">{meta.description}</p>
        </div>
      </div>
      <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-8 text-center mb-6`}>
        <p className={`text-4xl font-bold mb-2 ${meta.color}`}>Coming Soon</p>
        <p className="text-sm text-zinc-400">This module is being built. You have early access — stay tuned!</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">What&apos;s included</h2>
        <ul className="space-y-3">
          {meta.features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
              <svg className={`w-4 h-4 shrink-0 ${meta.color}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
