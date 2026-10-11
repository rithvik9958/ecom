'use client';
import { useState, useEffect } from 'react';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { User, Loader2, Phone, Mail, Calendar, Users, Camera, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import showToast from '@/lib/storeToast';
import StoreSelect from '@/components/storefront/StoreSelect';


export default function UserProfilePage() {
  const { user, loadUser, setUser } = useStoreAuth();
  
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', dob: '', gender: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ 
        name: user.name || '', 
        phone: user.phone || '',
        dob: user.dob || '',
        gender: user.gender || ''
      });
    }
  }, [user]);

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const token = localStorage.getItem('store_token');
      const res = await fetch('/api/store-auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Profile updated successfully');
        loadUser();
      } else {
        showToast.error(data.message || 'Failed to update profile');
      }
    } catch {
      showToast.error('Network error');
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('store_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/store-auth/profile/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        showToast.success('Profile picture updated!');
        setUser(data.user);
      } else {
        showToast.error(data.message || 'Failed to upload image');
      }
    } catch {
      showToast.error('Network error during upload');
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // Reset input
    }
  }

  return (
    <UserDashboardLayout title="My Profile">
      
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
          gap: '1.25rem',
          boxShadow: '0 10px 28px rgba(17, 24, 39, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            
            {/* Avatar with Camera Overlay */}
            <div style={{ position: 'relative', width: '74px', height: '74px', flexShrink: 0 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.85rem', fontWeight: '800', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
                {uploadingImage ? (
                  <Loader2 className="animate-spin" size={24} color="#ffffff" />
                ) : user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              {/* Floating Camera Button */}
              <label 
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: 0, 
                  width: '26px', 
                  height: '26px', 
                  borderRadius: '50%', 
                  background: '#ffffff', 
                  color: '#111827', 
                  border: '2px solid #111827', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  transition: 'transform 0.15s ease'
                }}
                title="Change display image"
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                />
                <Camera size={13} />
              </label>
            </div>

            {/* Profile Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {user?.name || 'User Profile'}
                </h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <ShieldCheck size={13} color="#ffffff" strokeWidth={2} /> Verified Customer
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
                {user?.email || 'Manage your personal details and account preferences'}
              </p>
            </div>
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
              ACTIVE
            </span>
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
              Account Status
            </span>
          </div>
        </div>

        {/* Profile Card with Form */}
        <div className="user-dashboard-card" style={{ padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', boxSizing: 'border-box' }}>

        {/* Profile Form */}
        <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', boxSizing: 'border-box' }}>
          
          {/* Grid Layout for Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
            
            {/* Full Name */}
            <div className="dashboard-form-group">
              <label className="dashboard-label">Full Name</label>
              <div className="dashboard-input-wrapper">
                <User className="dashboard-input-icon" size={17} />
                <input 
                  type="text" 
                  className="dashboard-input with-icon" 
                  placeholder="Enter your full name"
                  value={profileForm.name} 
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                  required 
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="dashboard-form-group">
              <label className="dashboard-label">
                Email Address <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>(Primary Login)</span>
              </label>
              <div className="dashboard-input-wrapper">
                <Mail className="dashboard-input-icon" size={17} />
                <input 
                  type="email" 
                  className="dashboard-input with-icon" 
                  value={user?.email || ''} 
                  disabled 
                  title="Email cannot be changed directly"
                />
              </div>
            </div>

            {/* Contacts */}
            <div className="dashboard-form-group">
              <label className="dashboard-label">Contact Number</label>
              <div className="dashboard-input-wrapper">
                <Phone className="dashboard-input-icon" size={17} />
                <input 
                  type="tel" 
                  className="dashboard-input with-icon" 
                  placeholder="e.g. +91 9876543210"
                  value={profileForm.phone} 
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} 
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="dashboard-form-group">
              <label className="dashboard-label">Date of Birth</label>
              <div className="dashboard-input-wrapper">
                <Calendar className="dashboard-input-icon" size={17} />
                <input 
                  type="date" 
                  className="dashboard-input with-icon" 
                  value={profileForm.dob} 
                  onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })} 
                  style={{ color: profileForm.dob ? 'inherit' : '#94a3b8' }}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="dashboard-form-group">
              <label className="dashboard-label">Gender</label>
              <StoreSelect
                value={profileForm.gender}
                onChange={(val) => setProfileForm({ ...profileForm, gender: val })}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                placeholder="Select Gender"
                size="lg"
                searchable={false}
                fullWidth={true}
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={() => loadUser()} 
              className="dashboard-secondary-btn"
            >
              Reset Changes
            </button>
            <button 
              type="submit" 
              className="dashboard-primary-btn"
              disabled={updatingProfile}
            >
              {updatingProfile ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {updatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
        </div>
      </div>
      
    </UserDashboardLayout>
  );
}
