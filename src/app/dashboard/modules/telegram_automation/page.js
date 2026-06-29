'use client';

import { useState } from 'react';

const FEATURES = [
  { key: 'bot_connection', label: 'Bot Connection' },
  { key: 'broadcast',      label: 'Broadcast' },
  { key: 'auto_reply',     label: 'Auto Reply' },
  { key: 'campaigns',      label: 'Campaigns' },
];

function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-500">
      <svg className="w-12 h-12 opacity-30" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm">Coming soon — this feature is under development.</p>
    </div>
  );
}

export default function TelegramAutomationPage() {
  const [feature, setFeature] = useState('bot_connection');

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Telegram Automation</h1>
            <p className="text-sm text-zinc-400">Build bots, broadcast messages, and automate Telegram campaigns</p>
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
                  ? 'bg-sky-500 text-white'
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
