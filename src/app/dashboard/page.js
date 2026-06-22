'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function UserDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setProfile(d.user ?? null))
      .catch(() => router.replace('/login'));
  }, [router]);

  if (!profile) return null;

  const plan      = profile.activePlan?.plan;
  const endDate   = profile.activePlan?.endDate ? new Date(profile.activePlan.endDate) : null;
  const daysLeft  = endDate ? Math.max(0, Math.ceil((endDate - Date.now()) / 86400000)) : 0;
  const planActive = endDate && endDate > new Date();

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {profile.firstName}!</h1>
        <p className="mt-1 text-sm text-zinc-400">Here's an overview of your account.</p>
      </div>

      {/* Active plan card */}
      <div className={`rounded-2xl border p-6 ${planActive ? 'bg-amber-400/5 border-amber-400/20' : 'bg-zinc-900 border-zinc-800'}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-1">Current Plan</p>
            {planActive && plan ? (
              <>
                <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Expires {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' '}· <span className="font-medium text-amber-500">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                </p>
                {plan.features?.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white">No active plan</h2>
                <p className="text-sm text-zinc-400 mt-1">Subscribe to unlock features.</p>
              </>
            )}
          </div>
          {planActive && plan?.photo && (
            <img src={`${API}${plan.photo}`} alt={plan.name} className="w-16 h-16 rounded-xl object-cover border border-amber-400/20" />
          )}
        </div>

        <Link href="/dashboard/plans" className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-400 text-zinc-900 rounded-xl hover:bg-amber-300 transition-colors">
          {planActive ? 'Upgrade Plan' : 'Browse Plans'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
