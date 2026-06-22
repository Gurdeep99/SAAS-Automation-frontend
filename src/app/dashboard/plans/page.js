'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL;

const userHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function UserPlansPage() {
  const router = useRouter();
  const [profile, setProfile]       = useState(null);
  const [plans, setPlans]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [buying, setBuying]         = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    try {
      const res  = await fetch(`${API}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { router.replace('/login'); return; }
      setProfile(data.user);
    } catch { router.replace('/login'); }
  }, [router]);

  const fetchPlans = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/plans`);
      const data = await res.json();
      setPlans(data.plans ?? []);
    } catch { setPlans([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); fetchPlans(); }, [fetchProfile, fetchPlans]);

  const handleBuy = async (plan) => {
    setBuying(plan._id);
    setSuccessMsg('');

    const ready = await loadRazorpay();
    if (!ready) { alert('Could not load payment gateway. Check your connection.'); setBuying(null); return; }

    try {
      const orderRes  = await fetch(`${API}/payment/create-order`, {
        method: 'POST', headers: userHeaders(), body: JSON.stringify({ planId: plan._id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { alert(orderData.message); setBuying(null); return; }

      const options = {
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        'Automation',
        description: plan.name,
        order_id:    orderData.orderId,
        prefill: {
          name:  profile ? `${profile.firstName} ${profile.lastName}` : '',
          email: profile?.email ?? '',
        },
        theme: { color: '#FBBF24' },
        handler: async (response) => {
          try {
            const verifyRes  = await fetch(`${API}/payment/verify`, {
              method: 'POST', headers: userHeaders(),
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                planId: plan._id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) { alert(verifyData.message); return; }
            setSuccessMsg(`"${plan.name}" activated! Your modules are now available in the sidebar.`);
            await fetchProfile();
          } catch { alert('Payment verification failed. Contact support.'); }
        },
        modal: { ondismiss: () => setBuying(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch { alert('Something went wrong. Please try again.'); } finally {
      setBuying(null);
    }
  };

  const activePlan  = profile?.activePlan?.plan;
  const endDate     = profile?.activePlan?.endDate ? new Date(profile.activePlan.endDate) : null;
  const planActive  = endDate && endDate > new Date();
  const daysLeft    = endDate ? Math.max(0, Math.ceil((endDate - Date.now()) / 86400000)) : 0;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-1">Choose a Plan</h1>
      <p className="text-sm text-zinc-400 mb-8">Select the plan that fits your needs.</p>

      {successMsg && (
        <div className="mb-6 px-4 py-3 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm font-medium rounded-xl">
          ✓ {successMsg}
        </div>
      )}

      {planActive && activePlan && (
        <div className="mb-8 flex items-center gap-4 px-5 py-4 bg-amber-400/5 border border-amber-400/20 rounded-2xl">
          <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-white">You&apos;re on <span className="text-amber-400">{activePlan.name}</span></p>
            <p className="text-xs text-zinc-400 mt-0.5">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining · expires {endDate.toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      )}

      <div className="mb-6 px-4 py-3 bg-zinc-800/60 border border-zinc-700 text-zinc-400 text-xs rounded-xl">
        <span className="font-semibold text-zinc-300">Razorpay Test Mode</span> — use card <span className="font-mono text-zinc-300">4111 1111 1111 1111</span>, any future expiry, CVV <span className="font-mono text-zinc-300">123</span>, OTP <span className="font-mono text-zinc-300">1234</span>.
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading plans…</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-zinc-500">No plans available right now.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = activePlan?._id === plan._id && planActive;
            return (
              <div key={plan._id} className={`bg-zinc-900 rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-lg ${isCurrent ? 'border-amber-400' : 'border-zinc-800'}`}>
                {plan.photo && (
                  <div className="h-32 overflow-hidden">
                    <img src={`${API}${plan.photo}`} alt={plan.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white">{plan.name}</h3>
                    {isCurrent && <span className="px-2 py-0.5 text-xs font-semibold text-amber-400 bg-amber-400/10 rounded-full">Current</span>}
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-sm text-zinc-400">/ {plan.durationDays} days</span>
                  </div>
                  {plan.features?.length > 0 && (
                    <ul className="space-y-2 mb-5 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={() => handleBuy(plan)}
                    disabled={buying === plan._id}
                    className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-colors mt-auto ${
                      isCurrent
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30 hover:bg-amber-400/20'
                        : 'bg-amber-400 text-zinc-900 hover:bg-amber-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {buying === plan._id ? 'Processing…' : isCurrent ? 'Renew Plan' : 'Buy Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
