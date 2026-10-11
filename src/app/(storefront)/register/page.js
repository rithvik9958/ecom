'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { Eye, EyeOff, AlertCircle, User, Mail, Phone, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import showToast from '@/lib/storeToast';
import { DEFAULT_AUTH_CONFIG } from '@/lib/authConfigConstants';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#ef4444', pct: 25 };
  if (score === 2) return { score, label: 'Fair', color: '#f59e0b', pct: 50 };
  if (score === 3) return { score, label: 'Good', color: '#3b82f6', pct: 75 };
  return { score, label: 'Strong', color: '#16a34a', pct: 100 };
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login } = useStoreAuth();

  const [authConfig, setAuthConfig] = useState(DEFAULT_AUTH_CONFIG);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(true);

  const pwStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

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
    if (name === 'name') {
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
    }
    if (name === 'email') {
      if (!value) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(value)) return 'Enter a valid email address';
    }
    if (name === 'phone') {
      if (value && !/^[0-9+\s\-()]{7,15}$/.test(value)) return 'Enter a valid phone number';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
    }
    if (name === 'confirmPassword') {
      if (!value) return 'Please confirm your password';
      if (value !== form.password) return 'Passwords do not match';
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
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'password' && form.confirmPassword) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: value !== form.confirmPassword ? 'Passwords do not match' : ''
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    const errors = {};
    ['name', 'email', 'phone', 'password', 'confirmPassword'].forEach(key => {
      const err = validateField(key, form[key]);
      if (err) errors[key] = err;
    });
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const res = await fetch('/api/store-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        await login(data.user, data.token, { mergeGuestCart: true });
        showToast.success('Account created! Welcome 🎉');
        router.push(redirect);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    window.location.href = `/api/store-auth/google?redirect=${encodeURIComponent(redirect)}`;
  }

  const overlayHex = authConfig.overlayColor || '#0b0f19';
  const opacity = authConfig.overlayOpacity ?? 0.85;
  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  const bgStyle = {
    backgroundImage: `linear-gradient(${overlayHex}${alphaHex}, ${overlayHex}${alphaHex}), url("${authConfig.bgImage || DEFAULT_AUTH_CONFIG.bgImage}")`
  };

  const inputField = (id, name, type, placeholder, icon, extraStyle = {}) => (
    <div className="auth-form-group">
      <label className="auth-form-label" htmlFor={id}>
        {name === 'name' ? 'Full Name' :
          name === 'email' ? 'Email Address' :
            name === 'phone' ? 'Phone Number' :
              name === 'password' ? 'Password' : 'Confirm Password'}
        {name === 'phone' && <span style={{ color: 'var(--fnp-gray-500, #6b7280)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '0.35rem', fontSize: '0.72rem' }}>(optional)</span>}
      </label>
      <div className="auth-input-wrapper">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={name === 'email' ? 'email' : name === 'name' ? 'name' : name === 'phone' ? 'tel' : name === 'password' ? 'new-password' : 'new-password'}
          className={`auth-form-input with-icon${fieldErrors[name] ? ' input-error' : ''}`}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          style={{ paddingRight: (name === 'password' || name === 'confirmPassword') ? '2.6rem' : undefined, ...extraStyle }}
        />
        <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--fnp-gray-500, #6b7280)', pointerEvents: 'none', display: 'flex', alignItems: 'center', zIndex: 1 }}>
          {icon}
        </span>
        {(name === 'password' || name === 'confirmPassword') && (
          <button
            type="button"
            className="auth-input-icon-btn"
            onClick={() => name === 'password' ? setShowPw(v => !v) : setShowConfirmPw(v => !v)}
            tabIndex={-1}
            aria-label={(name === 'password' ? showPw : showConfirmPw) ? 'Hide password' : 'Show password'}
          >
            {(name === 'password' ? showPw : showConfirmPw) ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {fieldErrors[name] && (
        <div className="auth-field-error"><AlertCircle size={12} />{fieldErrors[name]}</div>
      )}
      {/* Password strength */}
      {name === 'password' && form.password && (
        <div className="auth-pw-strength">
          <div className="auth-pw-strength-bar">
            <div className="auth-pw-strength-fill" style={{ width: `${pwStrength.pct}%`, background: pwStrength.color }} />
          </div>
          <span className="auth-pw-strength-label" style={{ color: pwStrength.color }}>
            {pwStrength.label} password
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="auth-page">
      {/* Left Brand Panel with Dynamic Background & Dark Overlay */}
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
          <h1 className="auth-brand-headline">
            {authConfig.registerHeadline || 'Join Us Today!'}
          </h1>
          <p className="auth-brand-sub">
            {authConfig.registerSubtitle || 'Create your account to enjoy a seamless shopping experience, track your orders, and unlock exclusive offers.'}
          </p>

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

      {/* Right Form Panel */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <Link href={redirect && redirect !== '/' ? redirect : '/'} className="auth-back-btn">
            <ArrowLeft size={14} /> Back to Store
          </Link>
          <h2 className="auth-card-title">Create Account</h2>
          <p className="auth-card-sub">
            Already have an account?{' '}
            <Link href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="auth-link">
              Sign in
            </Link>
          </p>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Google Button */}
          <button
            type="button"
            className="auth-btn-google"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            id="google-register-btn"
            style={{ marginBottom: '0.5rem' }}
          >
            {googleLoading ? <span className="auth-spinner auth-spinner-dark" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="auth-divider">or</div>

          <form onSubmit={handleSubmit} id="register-form" noValidate>
            {inputField('register-name', 'name', 'text', 'Full Name', <User size={16} />)}
            {inputField('register-email', 'email', 'email', 'Email Address', <Mail size={16} />)}
            {inputField('register-phone', 'phone', 'tel', 'Phone Number (optional)', <Phone size={16} />)}
            {inputField('register-password', 'password', showPw ? 'text' : 'password', 'Password (min 6 chars)', <Lock size={16} />)}
            {inputField('register-confirm-password', 'confirmPassword', showConfirmPw ? 'text' : 'password', 'Confirm Password', <Lock size={16} />)}

            {/* Terms */}
            <div className="auth-terms-row">
              <input
                type="checkbox"
                id="terms-checkbox"
                className="auth-terms-checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
              />
              <label htmlFor="terms-checkbox" className="auth-terms-label">
                I agree to the{' '}
                <Link href="/terms" className="auth-link" style={{ fontSize: 'inherit' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="auth-link" style={{ fontSize: 'inherit' }}>Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              id="register-submit"
              className="auth-btn-primary"
              disabled={loading || !termsAccepted}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? (
                <><span className="auth-spinner" /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
