'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/floating-input'
import { Camera, Check, User as UserIcon, Loader2, Shield, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const BASE_URL = ''

export default function ProfilePage() {
  const { user, loadUser } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', password: '' })
      setPreview(user.avatar ? `${BASE_URL}${user.avatar}` : null)
    }
  }, [user])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return showToast('Name is required', 'error')
    try {
      setSaving(true)
      const fd = new FormData()
      fd.append('name', form.name.trim())
      if (user?.role === 'super_admin') {
        if (form.email.trim()) fd.append('email', form.email.trim())
        if (form.password.trim()) fd.append('password', form.password.trim())
      }
      if (avatarFile) fd.append('avatar', avatarFile)

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      showToast('Profile updated successfully!')
      // Reload user so header/sidebar update immediately
      if (typeof loadUser === 'function') await loadUser()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const initials = (user?.name || 'A').charAt(0).toUpperCase()
  const roleBadge = user?.role === 'super_admin' ? 'Super Admin' : 'Admin'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb
        title="My Profile"
        subtitle="Manage your account details and profile photo"
        crumbs={[{ label: 'My Profile' }]}
      />

      <div className="max-w-2xl space-y-6">
        {/* Avatar card */}
        <div className="bg-background border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full bg-primary/10 border-4 border-background shadow-lg ring-2 ring-border overflow-hidden flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-primary">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors border-2 border-background"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Info */}
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Shield className="w-3 h-3" />
              {roleBadge}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="bg-background border border-border rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-semibold text-foreground border-b border-border pb-3">Account Details</h3>

          <FloatingInput
            label="Full Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />

          <FloatingInput
            label="Email Address"
            type="email"
            value={user?.role === 'super_admin' ? form.email : (user?.email || '')}
            onChange={e => user?.role === 'super_admin' ? setForm({ ...form, email: e.target.value }) : undefined}
            disabled={user?.role !== 'super_admin'}
            className={user?.role !== 'super_admin' ? "opacity-60 cursor-not-allowed" : ""}
            required={user?.role === 'super_admin'}
          />

          {user?.role === 'super_admin' && (
            <div className="relative">
              <FloatingInput
                label="New Password (leave blank to keep current)"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="pr-12"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="rounded-full px-8 py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-transform active:scale-95"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>

        {/* Avatar upload note */}
        <p className="text-xs text-muted-foreground text-center">
          Profile photo is saved to your account and displayed across the admin dashboard.
        </p>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={cn(
              'fixed bottom-8 right-8 px-6 py-3 rounded-xl shadow-2xl text-white text-sm font-bold z-50 flex items-center gap-3',
              toast.type === 'success' ? 'bg-primary text-primary-foreground' : 'bg-red-600'
            )}
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
