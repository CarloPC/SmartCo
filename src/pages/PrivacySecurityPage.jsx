import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Key, Eye, EyeOff, Save, ChevronRight } from 'lucide-react'

const PrivacySecurityPage = () => {
  const navigate = useNavigate()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const loginActivity = [
    { device: 'iPhone 13', location: 'Toledo City, Cebu', time: 'Just now', current: true },
    { device: 'Chrome on Windows', location: 'Toledo City, Cebu', time: '2 hours ago', current: false },
    { device: 'Android Phone', location: 'Cebu City', time: '1 day ago', current: false },
  ]

  const dataLinks = [
    { title: 'Download Your Data', description: 'Get a copy of your information' },
    { title: 'Privacy Policy', description: 'Read our privacy policy' },
    { title: 'Terms of Service', description: 'View terms and conditions' },
  ]

  /* glass card — matches HomePage panels */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10'

  const sectionHeader = (Icon, eyebrow, title) => (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
        <Icon className="h-4 w-4 text-blue-200" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-white/50">{eyebrow}</p>
        <p className="text-base font-semibold text-white">{title}</p>
      </div>
    </div>
  )

  const inputClasses =
    'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white placeholder-white/40 backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400'

  const handlePasswordChange = () => {
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match!')
      return
    }
    if (passwords.new.length < 8) {
      alert('Password must be at least 8 characters long!')
      return
    }
    // In real app, send to backend
    alert('Password changed successfully!')
    setPasswords({ current: '', new: '', confirm: '' })
  }

  return (
    /* No background here — Layout.jsx paints the gradient behind everything */
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/20 bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Privacy & Security</h1>
        <div className="w-10" />
      </div>

      {/* Change Password Section */}
      <div className={`${card} p-5`}>
        {sectionHeader(Lock, 'Account security', 'Change Password')}

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className={inputClasses}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
              >
                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className={inputClasses}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-white/40">Must be at least 8 characters long</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className={inputClasses}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={handlePasswordChange}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
          >
            <Save className="h-5 w-5" />
            <span>Update Password</span>
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className={`${card} p-5`}>
        {sectionHeader(Key, 'Extra protection', 'Two-Factor Authentication')}

        <div className="space-y-4">
          <p className="text-sm text-white/60">
            Add an extra layer of security to your account by enabling two-factor authentication (2FA).
          </p>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-white">Enable 2FA</p>
              <p className="mt-0.5 text-xs text-white/50">Require code from authentication app</p>
            </div>
            <label className="relative inline-block h-6 w-12 flex-shrink-0">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className="peer sr-only"
              />
              <div className="h-6 w-12 cursor-pointer rounded-full bg-white/20 shadow-inner ring-1 ring-white/20 transition-all after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 peer-checked:after:translate-x-6 peer-focus:outline-none" />
            </label>
          </div>

          {twoFactorEnabled && (
            <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="mb-2 text-sm font-medium text-blue-200">Setup Instructions:</p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-blue-100/80">
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code shown in the setup wizard</li>
                <li>Enter the 6-digit code to verify</li>
              </ol>
              <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 py-2 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-indigo-700">
                Start Setup
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Login Activity */}
      <div className={`${card} p-5`}>
        {sectionHeader(Shield, 'Where you\'re signed in', 'Recent Login Activity')}

        <div className="space-y-3">
          {loginActivity.map((activity, index) => (
            <div key={index} className="flex items-start justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{activity.device}</p>
                  {activity.current && (
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-white/60">{activity.location}</p>
                <p className="mt-0.5 text-xs text-white/40">{activity.time}</p>
              </div>
              {!activity.current && (
                <button className="text-sm font-medium text-rose-300 hover:text-rose-200">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data & Privacy */}
      <div className={`${card} p-5`}>
        {sectionHeader(Shield, 'Your information', 'Data & Privacy')}

        <div className="space-y-2">
          {dataLinks.map((link) => (
            <button
              key={link.title}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
            >
              <div>
                <p className="font-medium text-white">{link.title}</p>
                <p className="mt-0.5 text-xs text-white/50">{link.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/40" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PrivacySecurityPage