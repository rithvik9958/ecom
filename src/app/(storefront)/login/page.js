'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { Eye, EyeOff, AlertCircle, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import showToast from '@/lib/storeToast';
import { DEFAULT_AUTH_CONFIG } from '@/lib/authConfigConstants';

function GoogleIcon() {
  return (
    <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login } = useStoreAuth();

  const [authConfig, setAuthConfig] = useState(DEFAULT_AUTH_CONFIG);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetch('/api/store-auth-config')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.config) {
          setAuthConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  function validateField(name, value) {
    if (name === 'email') {
      if (!value) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(value)) return 'Enter a valid email address';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
    }
    return '';
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const emailErr = validateField('email', form.email);
    const pwErr = validateField('password', form.password);
    if (emailErr || pwErr) {
      setFieldErrors({ email: emailErr, password: pwErr });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/store-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        await login(data.user, data.token, { mergeGuestCart: true });
        showToast.success(`Welcome back, ${data.user.name?.split(' ')[0]}!`);
        router.push(redirect);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    window.location.href = `/api/store-auth/google?redirect=${encodeURIComponent(redirect)}`;
  }

  const overlayHex = authConfig.overlayColor || '#0b0f19';
  const opacity = authConfig.overlayOpacity ?? 0.85;
  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  const bgStyle = {
    backgroundImage: `linear-gradient(${overlayHex}${alphaHex}, ${overlayHex}${alphaHex}), url("${authConfig.bgImage || DEFAULT_AUTH_CONFIG.bgImage}")`
  };

  return (
    <div className="auth-page">
      <div className="auth-panel-left" style={bgStyle}>
        <div className="auth-panel-left-content">
          <Link href="/" className="auth-brand-logo-link" title="Return to Store">
            <img
              src={authConfig.logoUrl || '/elogo.png'}
              alt="Logo"
              className="auth-brand-logo"
              onError={e => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Link>
          <h1 className="auth-brand-headline">{authConfig.loginHeadline || 'Welcome Back!'}</h1>
          <p className="auth-brand-sub">{authConfig.loginSubtitle || 'Sign in to access your orders, saved addresses, and personalised shopping experience.'}</p>

          {authConfig.showFeatures !== false && (authConfig.featuresHtml || (authConfig.features || []).length > 0) && (
            <div
              className="auth-brand-rich-content"
              dangerouslySetInnerHTML={{
                __html: authConfig.featuresHtml || `<ul>${(authConfig.features || []).map(feat => `<li>${feat}</li>`).join('')}</ul>`
              }}
            />
          )}
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <Link href={redirect && redirect !== '/' ? redirect : '/'} className="auth-back-btn">
            <ArrowLeft size={14} /> Back to Store
          </Link>
          <h2 className="auth-card-title">Sign In</h2>
          <p className="auth-card-sub">
            New user?{' '}
            <Link href={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="auth-link">
              Create an account
            </Link>
          </p>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            className="auth-btn-google"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            id="google-login-btn"
          >
            {googleLoading ? (
              <span className="auth-spinner auth-spinner-dark" />
            ) : (
              <GoogleIcon />
            )}
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider">or</div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} id="login-form" noValidate>
            {/* Email */}
            <div className="auth-form-group">
              <label className="auth-form-label" htmlFor="login-email">Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`auth-form-input with-icon${fieldErrors.email ? ' input-error' : ''}`}
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                />
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--fnp-gray-500, #6b7280)', pointerEvents: 'none', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                  <Mail size={16} />
                </span>
              </div>
              {fieldErrors.email && (
                <div className="auth-field-error"><AlertCircle size={12} />{fieldErrors.email}</div>
              )}
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="auth-form-label" htmlFor="login-password" style={{ margin: 0 }}>Password</label>
                <Link href="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
              </div>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`auth-form-input with-icon${fieldErrors.password ? ' input-error' : ''}`}
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  style={{ paddingRight: '2.6rem' }}
                />
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--fnp-gray-500, #6b7280)', pointerEvents: 'none', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                  <Lock size={16} />
                </span>
                <button
                  type="button"
                  className="auth-input-icon-btn"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="auth-field-error"><AlertCircle size={12} />{fieldErrors.password}</div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              className="auth-btn-primary"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <><span className="auth-spinner" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="auth-link">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="auth-link">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
