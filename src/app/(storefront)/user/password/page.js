'use client';
import { useState } from 'react';
import Link from 'next/link';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { Lock, Loader2, ShieldCheck, Eye, EyeOff, KeyRound, Sparkles, Check } from 'lucide-react';
import showToast from '@/lib/storeToast';

export default function UserPasswordPage() {
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updatingPw, setUpdatingPw] = useState(false);

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) {
      showToast.error('Password must be at least 6 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast.error('New passwords do not match');
      return;
    }
    
    setUpdatingPw(true);
    try {
      const token = localStorage.getItem('store_token');
      const res = await fetch('/api/store-auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Password changed successfully!');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast.error(data.message || 'Failed to change password');
      }
    } catch {
      showToast.error('Network error');
    } finally {
      setUpdatingPw(false);
    }
  }

  return (
    <UserDashboardLayout title="Security & Password">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Luxury Dark Summary Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)',
          borderRadius: '18px',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 28px rgba(17, 24, 39, 0.12)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={22} color="#ffffff" strokeWidth={2} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Security &amp; Password
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Manage your credentials, update your login password, and keep your account safe.
            </p>
          </div>

          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255,255,255,0.08)', 
            padding: '0 1rem', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.12)',
            height: '42px',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1 }}>
              PROTECTED
            </span>
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
              256-Bit Encrypted
            </span>
          </div>
        </div>

        {/* Main Password Form Card */}
        <div className="user-dashboard-card" style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', boxSizing: 'border-box' }}>
          <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
            
            {/* Current Password */}
            <div className="dashboard-form-group">
              <label className="dashboard-label">Current Password</label>
              <div className="dashboard-input-wrapper">
                <KeyRound className="dashboard-input-icon" size={17} />
                <input 
                  type={showCurrent ? 'text' : 'password'} 
                  className="dashboard-input with-icon" 
                  placeholder="Enter your current password"
                  value={pwForm.currentPassword} 
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} 
                  required 
                  style={{ paddingRight: '2.75rem' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: '0.85rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            {/* New Password */}
            <div className="dashboard-form-group">
              <label className="dashboard-label">New Password</label>
              <div className="dashboard-input-wrapper">
                <Lock className="dashboard-input-icon" size={17} />
                <input 
                  type={showNew ? 'text' : 'password'} 
                  className="dashboard-input with-icon" 
                  placeholder="Enter new password (min 6 chars)"
                  value={pwForm.newPassword} 
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} 
                  required 
                  minLength={6}
                  style={{ paddingRight: '2.75rem' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: '0.85rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            {/* Confirm New Password */}
            <div className="dashboard-form-group">
              <label className="dashboard-label">Confirm New Password</label>
              <div className="dashboard-input-wrapper">
                <Lock className="dashboard-input-icon" size={17} />
                <input 
                  type={showConfirm ? 'text' : 'password'} 
                  className="dashboard-input with-icon" 
                  placeholder="Re-enter new password"
                  value={pwForm.confirmPassword} 
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} 
                  required 
                  minLength={6}
                  style={{ paddingRight: '2.75rem' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '0.85rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Tips Pill Box */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Password Requirements:</span>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.76rem', color: '#64748b', lineHeight: 1.5 }}>
                <li>Minimum 6 characters long</li>
                <li>Use a combination of letters, numbers &amp; special characters</li>
                <li>Never share your credentials with third parties</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.25rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/forgot-password" style={{ fontSize: '0.86rem', color: '#64748b', textDecoration: 'underline', fontWeight: 600, marginRight: 'auto' }}>
                Forgot current password?
              </Link>

              <button 
                type="button" 
                onClick={() => setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                className="dashboard-secondary-btn"
              >
                Clear
              </button>

              <button 
                type="submit" 
                disabled={updatingPw} 
                className="dashboard-primary-btn"
              >
                {updatingPw ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {updatingPw ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </UserDashboardLayout>
  );
}
