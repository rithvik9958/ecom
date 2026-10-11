'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import '@/components/dashboard/dashboard.css';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Dynamic store branding and dashboard theme color state
  const [branding, setBranding] = useState({
    adminTitle: 'MyCart',
    brandName: 'MyCarts',
    adminLogo: '',
    primaryColor: '#a855f7',
    accentColor: '#ec4899',
  });

  useEffect(() => {
    // Fetch active store theme and global branding
    const loadBranding = async () => {
      try {
        const [themeRes, globalRes] = await Promise.all([
          fetch('/api/admin/theme').then(r => r.json()).catch(() => null),
          fetch('/api/global-settings').then(r => r.json()).catch(() => null),
        ]);

        const theme = themeRes?.theme || {};
        const globalData = globalRes?.data || {};
        const dashTheme = theme.dashboardTheme || {};

        const primaryColor = dashTheme.primaryColor || theme.primaryColor || '#a855f7';
        const accentColor = dashTheme.accentColor || theme.accentColor || primaryColor;

        setBranding({
          adminTitle: theme.adminTitle || globalData.adminTitle || 'MyCart',
          brandName: theme.brandName || globalData.adminTitle || 'MyCarts',
          adminLogo: theme.adminLogo || globalData.adminLogo || theme.logo || globalData.logoImage || '',
          primaryColor,
          accentColor,
        });
      } catch (err) {
        console.error('Failed to load branding in login page', err);
      }
    };

    loadBranding();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.username, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Invalid email or password');

      // Store non-sensitive UI state — actual token is in HttpOnly cookie
      localStorage.setItem('admin_logged_in', 'true');
      localStorage.setItem('admin_login_history', 'true');
      if (data.user) localStorage.setItem('admin_user', JSON.stringify(data.user));

      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="h-screen max-h-screen w-screen max-w-[100vw] overflow-hidden flex items-center justify-center bg-[#edf1f7] text-slate-900 font-sans p-3 sm:p-4 md:p-6 select-none">
      
      {/* Main Container Card — Full-attached split layout enlarged to match reference */}
      <div className="w-full max-w-[1100px] h-[580px] max-h-[92vh] bg-white rounded-[30px] sm:rounded-[34px] shadow-[0_25px_80px_-15px_rgba(15,23,42,0.13)] border border-slate-200/80 flex flex-col lg:flex-row items-stretch overflow-hidden">

        {/* ── LEFT COLUMN: FULL ATTACHED with Dynamic Theme Color, Starburst, and 3D Characters ── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[45%] xl:w-[46%] h-full p-8 xl:p-10 pb-0 xl:pb-0 text-white overflow-hidden relative shadow-inner transition-all duration-500"
          style={{
            background: branding.accentColor && branding.accentColor !== branding.primaryColor
              ? `linear-gradient(150deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`
              : branding.primaryColor,
          }}
        >
          {/* Subtle concentric rings decorative lines matching reference */}
          <svg className="absolute -right-24 -top-24 w-[520px] h-[520px] text-white/10 pointer-events-none" viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="80" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="200" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="260" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          {/* Top Section: Starburst Icon, Title, and Subtitle */}
          <div className="relative z-10 pt-0.5">
            {/* Starburst icon matching reference */}
            <div className="w-10 h-10 mb-3 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
              </svg>
            </div>

            <h2 className="text-[32px] xl:text-[36px] font-black tracking-tight leading-[1.14] text-white mb-2.5">
              Welcome<br />
              Back!
            </h2>

            <p className="text-white/85 text-xs xl:text-sm font-medium leading-relaxed max-w-[320px]">
              Sign in to continue managing your dashboard, monitor key insights, and stay in control of your operations with ease.
            </p>
          </div>

          {/* Middle/Bottom: 3D Team Illustration — Starting flush from bottom & larger */}
          <div className="relative z-10 mt-auto flex justify-center items-end pointer-events-none leading-none">
            <img
              src="/images/login-team-closeup.png?v=2"
              alt="eCommerce Management Team"
              style={{ maxHeight: '295px', width: 'auto' }}
              className="w-full max-w-[350px] xl:max-w-[385px] object-contain select-none drop-shadow-md block"
            />
          </div>
        </div>

        {/* ── RIGHT COLUMN: Clean Authentication Form Matching Reference ── */}
        <div className="w-full lg:w-[55%] xl:w-[54%] h-full flex flex-col justify-center px-6 py-6 sm:px-10 lg:px-12 xl:px-14 overflow-hidden">
          <div className="max-w-[390px] w-full mx-auto">

            {/* Top Brand Logo & Store Name — Increased by ~30% as requested */}
            <div className="flex items-center justify-center gap-3.5 mb-4">
              {branding.adminLogo && !branding.adminLogo.includes('1787822628596-efav.png') ? (
                <img
                  src={branding.adminLogo}
                  alt={branding.brandName}
                  style={{ maxHeight: '62px', height: '62px', width: 'auto', maxWidth: '220px' }}
                  className="object-contain drop-shadow-sm"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <img
                  src="/images/clean-cart-icon.png"
                  alt={branding.brandName}
                  style={{ maxHeight: '60px', height: '60px', width: 'auto' }}
                  className="object-contain drop-shadow-sm"
                />
              )}
              <span className="font-black text-[28px] sm:text-[32px] text-slate-900 tracking-tight">
                {branding.brandName || branding.adminTitle || 'MyCarts'}
              </span>
            </div>

            {/* Welcome Back Header */}
            <div className="text-center mb-5">
              <h1 className="text-[26px] sm:text-[28px] font-black text-slate-900 tracking-tight mb-1">
                Welcome Back!
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                Please enter your credentials to access the admin portal.
              </p>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="bg-rose-50 border border-rose-200/80 text-rose-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Login Form with Stacked Labels */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Email Address Input */}
              <div
                className="px-4 py-2.5 rounded-xl bg-[#f0f4f9] border border-transparent transition-all"
                style={focusedField === 'email' ? {
                  borderColor: `${branding.primaryColor}88`,
                  boxShadow: `0 0 0 3px ${branding.primaryColor}1a`,
                  backgroundColor: '#ffffff'
                } : {}}
              >
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="admin@eshop.com"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  className="w-full bg-transparent text-[15px] font-semibold text-slate-800 placeholder-slate-400 transition-all outline-none"
                />
              </div>

              {/* Password Input with Eye Toggle */}
              <div
                className="relative px-4 py-2.5 rounded-xl bg-[#f0f4f9] border border-transparent transition-all"
                style={focusedField === 'password' ? {
                  borderColor: `${branding.primaryColor}88`,
                  boxShadow: `0 0 0 3px ${branding.primaryColor}1a`,
                  backgroundColor: '#ffffff'
                } : {}}
              >
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                  Password
                </label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className="w-full pr-8 bg-transparent text-[15px] font-semibold text-slate-800 placeholder-slate-400 transition-all outline-none"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 bottom-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: branding.primaryColor,
                    boxShadow: `0 8px 22px -4px ${branding.primaryColor}55`,
                  }}
                  className="w-full h-[50px] rounded-xl text-white font-bold text-sm hover:opacity-95 transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <span>Login Now</span>
                  )}
                </Button>
              </div>
            </form>

            {/* Relocated Copyright Text — Clean subtle footer */}
            <div className="mt-5 text-center text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} {branding.brandName || 'MyCarts'}. All rights reserved.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

