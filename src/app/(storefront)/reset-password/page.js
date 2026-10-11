'use client';
import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Lock, ArrowLeft, ArrowRight } from 'lucide-react';

function getPasswordStrength(pw) {
  if (!pw) return { label: '', color: '', pct: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: '#ef4444', pct: 25 };
  if (score === 2) return { label: 'Fair', color: '#f59e0b', pct: 50 };
  if (score === 3) return { label: 'Good', color: '#3b82f6', pct: 75 };
  return { label: 'Strong', color: '#16a34a', pct: 100 };
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword]         = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState('');
  const [error, setError]               = useState('');
  const [fieldErrors, setFieldErrors]   = useState({});

  const pwStrength = useMemo(() => getPasswordStrength(password), [password]);

  function validate() {
    const errors = {};
    if (!password) errors.password = 'New password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!confirmPw) errors.confirmPw = 'Please confirm your new password';
    else if (confirmPw !== password) errors.confirmPw = 'Passwords do not match';
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/store-auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || 'Password updated successfully!');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.message || 'Failed to reset password. The link may have expired.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // Invalid / missing token
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-panel-left">
          <img src="/logo.png" alt="Logo" className="auth-brand-logo" onError={e => { e.target.style.display = 'none'; }} />
          <h1 className="auth-brand-headline">Invalid Link</h1>
          <p className="auth-brand-sub">This reset link is missing or has already been used. Request a new one from the forgot password page.</p>
        </div>
        <div className="auth-panel-right">
          <div className="auth-card">
            <h2 className="auth-card-title">Link Invalid</h2>
            <p className="auth-card-sub">This password reset link is missing or invalid.</p>
            <div className="auth-alert auth-alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>The reset link is either missing or has already been used.</span>
            </div>
            <Link href="/forgot-password" className="auth-btn-primary" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
              Request a New Link
            </Link>
            <div style={{ marginTop: '1rem' }}>
              <Link href="/login" className="auth-btn-outline" style={{ textDecoration: 'none' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-panel-left">
        <img src="/logo.png" alt="Logo" className="auth-brand-logo" onError={e => { e.target.style.display = 'none'; }} />
        <h1 className="auth-brand-headline">Choose a New Password</h1>
        <p className="auth-brand-sub">
          Create a strong, unique password to keep your account secure.
        </p>
        <div className="auth-brand-features">
          {[
            'At least 6 characters',
            'Mix uppercase and numbers for strength',
            'Avoid reusing old passwords',
            'Link expires after 1 hour',
          ].map(feat => (
            <div key={feat} className="auth-brand-feature">
              <span className="auth-brand-feature-dot" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Set New Password</h2>
          <p className="auth-card-sub">Enter and confirm your new password below.</p>

          {/* Success */}
          {success && (
            <div className="auth-alert auth-alert-success" role="status">
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div>{success}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.8 }}>Redirecting to sign in…</div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div>{error}</div>
                {error.toLowerCase().includes('expired') && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <Link href="/forgot-password" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
                      Request a new link →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} id="reset-password-form" noValidate>
              {/* New Password */}
              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="new-password">New Password</label>
                <div className="auth-input-wrapper">
                  <input
                    id="new-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`auth-form-input${fieldErrors.password ? ' input-error' : ''}`}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                    disabled={loading}
                    style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
                  />
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--fnp-gray-500)', pointerEvents: 'none' }}>
                    <Lock size={15} />
                  </span>
                  <button type="button" className="auth-input-icon-btn" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && <div className="auth-field-error"><AlertCircle size={12} />{fieldErrors.password}</div>}
                {/* Password strength */}
                {password && (
                  <div className="auth-pw-strength">
                    <div className="auth-pw-strength-bar">
                      <div className="auth-pw-strength-fill" style={{ width: `${pwStrength.pct}%`, background: pwStrength.color }} />
                    </div>
                    <span className="auth-pw-strength-label" style={{ color: pwStrength.color }}>{pwStrength.label} password</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="confirm-password">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`auth-form-input${fieldErrors.confirmPw ? ' input-error' : (confirmPw && confirmPw === password ? ' input-success' : '')}`}
                    placeholder="Repeat your new password"
                    value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setFieldErrors(p => ({ ...p, confirmPw: '' })); }}
                    disabled={loading}
                    style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
                  />
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--fnp-gray-500)', pointerEvents: 'none' }}>
                    <Lock size={15} />
                  </span>
                  <button type="button" className="auth-input-icon-btn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.confirmPw && <div className="auth-field-error"><AlertCircle size={12} />{fieldErrors.confirmPw}</div>}
              </div>

              <button
                type="submit"
                id="reset-submit"
                className="auth-btn-primary"
                disabled={loading}
                style={{ marginTop: '0.5rem' }}
              >
                {loading ? (
                  <><span className="auth-spinner" /> Updating password…</>
                ) : (
                  <>Update Password <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/login" className="auth-btn-outline" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="auth-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-spinner auth-spinner-dark" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
