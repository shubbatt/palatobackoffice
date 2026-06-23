'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { auth } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await auth.login(email, password);
      setAuth(res.data.user, res.data.token);
      router.push('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-bg">

      {/* ── Decorative ambient circles (fixed, behind everything) ── */}
      <div
        style={{
          position: 'fixed', top: '-10%', left: '-5%',
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed', bottom: '-15%', right: '5%',
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed', top: '40%', left: '35%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.04) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* ── LEFT PANEL ── */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-between bg-surface border-r border-border overflow-hidden p-12">
        {/* Decorative geometric shapes */}
        <div
          style={{
            position: 'absolute', top: -60, right: -60,
            width: 240, height: 240, borderRadius: '50%',
            border: '1px solid rgba(245,166,35,0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute', top: -20, right: -20,
            width: 140, height: 140, borderRadius: '50%',
            border: '1px solid rgba(245,166,35,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: 80, left: -40,
            width: 180, height: 180, borderRadius: '50%',
            border: '1px solid rgba(42,51,71,0.6)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: 200, right: 40,
            width: 80, height: 80,
            border: '1px solid rgba(245,166,35,0.1)',
            transform: 'rotate(45deg)',
          }}
        />
        <div
          style={{
            position: 'absolute', top: '45%', left: '10%',
            width: 4, height: 4, borderRadius: '50%',
            background: 'rgba(245,166,35,0.4)',
          }}
        />
        <div
          style={{
            position: 'absolute', top: '30%', right: '20%',
            width: 6, height: 6, borderRadius: '50%',
            background: 'rgba(34,197,94,0.3)',
          }}
        />

        {/* Brand */}
        <div>
          <div className="flex items-center gap-4 mb-3">
            <img src="/logo-mark.png" alt="" className="h-16 w-auto invert mix-blend-screen" />
            <h1 className="text-5xl font-black tracking-tight">
              <span className="text-accent">P</span>ALATO
            </h1>
          </div>
          <p className="text-muted text-base font-medium tracking-wide uppercase" style={{ letterSpacing: '0.12em' }}>
            Daily Operations Framework
          </p>
        </div>

        {/* Feature bullets */}
        <div className="flex flex-col gap-6">
          {[
            { title: 'Real-time shift management', desc: 'Track opening, closing, and handovers with live status updates.' },
            { title: 'Full audit trail', desc: 'Every log, temp check, and cash entry is timestamped and traceable.' },
            { title: 'Role-based access control', desc: 'Each team member sees only what they need — nothing more.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div
                className="shrink-0 flex items-center justify-center rounded-full"
                style={{ width: 32, height: 32, background: 'rgba(245,166,35,0.12)', marginTop: 2 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="text-accent" style={{ width: 15, height: 15 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-text text-sm font-semibold">{f.title}</p>
                <p className="text-muted text-xs mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom decoration */}
        <div className="text-xs text-muted opacity-50">
          © {new Date().getFullYear()} Palato · All rights reserved
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="relative flex w-full md:w-1/2 flex-col items-center justify-center px-6 py-12" style={{ zIndex: 1 }}>
        <div className="animate-fade-in w-full max-w-md">

          {/* Logo (mobile only — left panel handles desktop) */}
          <div className="mb-8 flex flex-col items-center text-center md:hidden">
            <div className="flex items-center gap-3">
              <img src="/logo-mark.png" alt="" className="h-12 w-auto invert mix-blend-screen" />
              <h1 className="text-3xl font-black tracking-tight mt-1">
                <span className="text-accent">P</span>ALATO
              </h1>
            </div>
            <p className="mt-2 text-sm text-muted">Daily Operations Framework</p>
          </div>

          {/* Card */}
          <div className="glass rounded-2xl p-10">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text">Welcome back</h2>
              <p className="text-muted text-sm mt-1">Sign in to your operations dashboard</p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Email field */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@palato.mv"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full h-12 rounded-xl bg-surface border border-border text-text text-sm px-11 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full h-12 rounded-xl bg-surface border border-border text-text text-sm px-11 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                id="login-submit"
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="w-full h-12 rounded-xl bg-accent text-bg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign in →'
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted">
            Palato v1.1 · Internal use only
          </p>
        </div>
      </div>
    </div>
  );
}
