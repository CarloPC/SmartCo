
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Loader2, CheckCircle, Shield, Zap, Bell } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useAuth } from '../context/AuthContext'
import BARANGAY_CONFIG from '../config/barangayConfig'
import { PUROKS_ILIHAN } from '../constants/puroks'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    purok: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    setLoading(true)
    try {
      const result = await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        purok: formData.purok,
        password: formData.password
      })
      if (result.success) {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const benefits = [
    { icon: Shield, text: 'Secure & encrypted data storage' },
    { icon: Zap, text: 'AI-powered barangay analytics' },
    { icon: Bell, text: 'Real-time emergency alerts' },
    { icon: CheckCircle, text: 'Streamlined approval workflows' },
  ]

  /* glass card â€” matches HomePage.jsx */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10'
  const inputClass =
  'w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 outline-none text-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-cyan-300/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] focus:scale-[1.02] focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/70 focus:shadow-[0_0_35px_rgba(34,211,238,0.55)]'
  const selectClass =
  'w-full px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white outline-none text-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-cyan-300/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] focus:scale-[1.02] focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/70 focus:shadow-[0_0_35px_rgba(34,211,238,0.55)] [&>option]:bg-slate-900 [&>option]:text-white'

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">

      {/* Decorative glow blobs â€” matches Layout.jsx global gradient treatment */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      {/* â”€â”€ LEFT BRAND PANEL (desktop only) â”€â”€ */}
      <div className="relative z-10 hidden lg:flex lg:w-2/5 xl:w-1/2 flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${toledoImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-indigo-950/88 to-blue-950/92" />
        </div>

        <div className="relative z-10">
          <div className="group flex items-center space-x-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-cyan-300/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.30)]">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <div className="relative group">
                <span className="text-blue-600 font-bold text-xl leading-none">S</span>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="text-white font-bold text-xl">SmartCo</div>
              <div className="text-blue-200 text-xs">Barangay Management System</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Join Barangay Ilihan's<br />
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Smart Governance
            </span>
          </h1>
          <p className="text-blue-200 text-base mb-10 max-w-sm">
            Create your account and start managing Barangay Ilihan services smarter, faster, and more efficiently.
          </p>

          <div className="space-y-4">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-cyan-500/20 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.45)]">
                  <b.icon className="w-4 h-4 text-blue-200 transition-all duration-300 group-hover:text-cyan-300 group-hover:rotate-6" />
                </div>
                <span className="text-blue-100 text-sm transition-all duration-300 group-hover:text-cyan-200">
  {b.text}
</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-300/60 text-sm">Â© 2026 SmartCo. All rights reserved.</p>
      </div>

      {/* â”€â”€ RIGHT FORM PANEL â”€â”€ */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${toledoImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-950/88 to-indigo-950/92" />
          </div>
        </div>

        <div className="relative z-10 flex flex-col flex-1 justify-center items-center p-6 sm:p-10">
          <div className="w-full max-w-md py-8">
            {/* Back button */}
            <div className="mb-8 inline-block">
  <button
    onClick={() => navigate('/')}
    className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-xl transition-all duration-300 hover:-translate-x-1 hover:scale-105 hover:border-cyan-300/50 hover:bg-white/15 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)]"
  >
    <ArrowLeft className="w-4 h-4 text-white/70 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-cyan-300" />

    <span className="text-sm font-medium text-white/70 transition-all duration-300 group-hover:text-white">
      Back to Home
    </span>
  </button>
</div>

            {/* Mobile logo */}
            <div className="text-center mb-8 lg:hidden">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <span className="text-blue-600 font-bold text-2xl">S</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Create Account</h1>
              <p className="text-blue-100 text-sm">Join SmartCo System</p>
            </div>

            {/* Form Card */}
            <div className={`${card} p-8`}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Create Account</h2>
                <p className="text-white/50 text-sm mt-1">Fill in your details to get started</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-400/30 rounded-xl flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                  <p className="text-sm text-emerald-200">Registration successful! Redirecting to login...</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Barangay Information - Fixed */}
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 mb-4">
                  <p className="text-xs font-medium text-cyan-200 mb-2">Registration Area</p>
                  <div className="space-y-1">
                    <p className="text-sm text-white font-semibold">{BARANGAY_CONFIG.fullBarangayName}</p>
                    <p className="text-xs text-white/70">{BARANGAY_CONFIG.municipality}, {BARANGAY_CONFIG.province}, {BARANGAY_CONFIG.country}</p>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 transition-all duration-300 group-focus-within:text-cyan-300" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                {/* Email + Phone grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                    <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 transition-all duration-300 group-focus-within:text-cyan-300" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 transition-all duration-300 group-focus-within:text-cyan-300" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+63 xxx xxx xxxx"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Role + Purok grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className={selectClass}
                      required
                    >
                      <option value="">Select role</option>
                      <option value="resident">Resident</option>
                      <option value="bhw">Barangay Health Worker</option>
                      <option value="barangay_official">Barangay Official</option>
                    </select>
                    <p className="mt-1.5 text-xs text-white/40">
                      Need admin access?{' '}
                      <Link to="/login" className="text-blue-300 font-medium hover:underline">
                        Sign in and request it here
                      </Link>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Purok</label>
                    <select
                      name="purok"
                      value={formData.purok}
                      onChange={handleChange}
                      className={selectClass}
                      required
                    >
                      <option value="">Select your purok</option>
                      {PUROKS_ILIHAN.map((purok) => (
                        <option key={purok} value={purok}>
                          {purok}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password + Confirm grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 transition-all duration-300 group-focus-within:text-cyan-300" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 characters"
                        className={`${inputClass} pr-10`}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                        className={`${inputClass} pr-10`}
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-400 flex-shrink-0"
                    required
                  />
                  <label className="text-sm text-white/60">
                    I agree to the{' '}
                    <span className="text-blue-300 font-medium cursor-pointer hover:underline">Terms and Conditions</span>
                    {' '}and{' '}
                    <span className="text-blue-300 font-medium cursor-pointer hover:underline">Privacy Policy</span>
                  </label>
                </div>

                {/* Submit */}
                <div className="pt-2">
  <button
    type="submit"
    disabled={loading || success}
    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:from-cyan-500 hover:to-blue-600 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
  >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating account...</span></>
                  ) : success ? (
                    <><CheckCircle className="w-4 h-4" /><span>Account created!</span></>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
</div>
              </form>

              <p className="text-center text-sm text-white/60 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-300 hover:text-blue-200 font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage

