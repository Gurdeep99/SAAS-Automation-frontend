'use client';

import { useState } from 'react';

const FEATURES = [
  { key: 'page_posts',  label: 'Page Posts' },
  { key: 'comments',   label: 'Comments' },
  { key: 'messenger',  label: 'Messenger Bot' },
  { key: 'lead_ads',   label: 'Lead Ads' },
  { key: 'campaigns',  label: 'Campaigns' },
];

function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-500">
      <svg className="w-12 h-12 opacity-30" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm">Coming soon — this feature is under development.</p>
    </div>
  );
}

export default function FacebookAutomationPage() {
  const [feature, setFeature] = useState('page_posts');

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Facebook Automation</h1>
            <p className="text-sm text-zinc-400">Automate your Facebook page, comments, messenger, and campaigns</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-6 overflow-x-auto">
          {FEATURES.map((f) => (
            <button
              key={f.key}
              onClick={() => setFeature(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                feature === f.key
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <ComingSoon title={FEATURES.find((f) => f.key === feature)?.label ?? ''} />
        </div>
      </div>
    </div>
  );
}
