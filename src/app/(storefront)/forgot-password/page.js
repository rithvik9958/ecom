'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { DEFAULT_AUTH_CONFIG } from '@/lib/authConfigConstants';

export default function ForgotPasswordPage() {
  const [authConfig, setAuthConfig] = useState(DEFAULT_AUTH_CONFIG);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

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

  function validate() {
    if (!email) return 'Email address is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email address';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) { setFieldError(err); return; }
    setFieldError('');
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/store-auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || 'If an account with that email exists, a reset link has been sent.');
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const overlayHex = authConfig.overlayColor || '#0b0f19';
  const opacity = authConfig.overlayOpacity ?? 0.85;
  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  const bgStyle = {
    backgroundImage: `linear-gradient(${overlayHex}${alphaHex}, ${overlayHex}${alphaHex}), url("${authConfig.bgImage || DEFAULT_AUTH_CONFIG.bgImage}")`
  };

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
            {authConfig.forgotHeadline || 'Reset Your Password'}
          </h1>
          <p className="auth-brand-sub">
            {authConfig.forgotSubtitle || "Enter the email linked to your account and we'll send you a secure link to reset your password."}
          </p>

          {authConfig.showFeatures !== false && (
            <div
              className="auth-brand-rich-content"
              dangerouslySetInnerHTML={{
                __html: authConfig.featuresHtml || `<ul>${[
                  'Reset link expires in 1 hour',
                  'Check your spam folder if not received',
                  'Contact support if you need help',
                ].map(feat => `<li>${feat}</li>`).join('')}</ul>`
              }}
            />
          )}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <Link href="/login" className="auth-back-btn">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
          <h2 className="auth-card-title">Forgot Password?</h2>
          <p className="auth-card-sub">
            No worries — we&apos;ll email you instructions to reset your password.
          </p>

          {/* Success Banner */}
          {success && (
            <div className="auth-alert auth-alert-success" role="status">
              <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{success}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} id="forgot-password-form" noValidate>
              <div className="auth-form-group">
                <label className="auth-form-label" htmlFor="forgot-email">Email Address</label>
                <div className="auth-input-wrapper">
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    className={`auth-form-input with-icon${fieldError ? ' input-error' : ''}`}
                    placeholder="Email Address"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldError(''); }}
                    onBlur={() => { const err = validate(); setFieldError(err); }}
                    disabled={loading}
                  />
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--fnp-gray-500, #6b7280)', pointerEvents: 'none', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                    <Mail size={16} />
                  </span>
                </div>
                {fieldError && (
                  <div className="auth-field-error"><AlertCircle size={12} />{fieldError}</div>
                )}
              </div>

              <button
                type="submit"
                id="forgot-submit"
                className="auth-btn-primary"
                disabled={loading}
                style={{ marginTop: '0.5rem' }}
              >
                {loading ? (
                  <><span className="auth-spinner" /> Sending link…</>
                ) : (
                  <>Send Reset Link <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--fnp-gray-500, #6b7280)', marginBottom: '1.25rem' }}>
                Didn&apos;t receive it?{' '}
                <button
                  type="button"
                  onClick={() => { setSuccess(''); setEmail(''); }}
                  className="auth-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                >
                  Try again
                </button>
              </p>
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <Link
              href="/login"
              className="auth-btn-outline"
              style={{ textDecoration: 'none' }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
