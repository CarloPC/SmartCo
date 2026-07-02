import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Loader2, Heart, Package, Calendar, Users, ArrowLeft } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(formData.email, formData.password, formData.rememberMe)
      if (result.success) {
        const role = result.user?.role
        navigate(role === 'bhw' ? '/bhw' : '/home')
      } else {
        setError(result.error || 'Login failed. Please try again.')
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

  const featureItems = [
    { icon: Heart, label: 'Health Monitoring' },
    { icon: Package, label: 'Food Aid Distribution' },
    { icon: Calendar, label: 'Community Events' },
    { icon: Users, label: 'Resident Management' },
  ]

  /* glass card — matches HomePage.jsx */
  const card =
    'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10'
  const inputClass =
  'w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 outline-none text-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:border-cyan-300/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] focus:scale-[1.02] focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/70 focus:shadow-[0_0_35px_rgba(34,211,238,0.55)]'

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">

      {/* Decorative glow blobs — matches Layout.jsx global gradient treatment */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      {/* ── LEFT BRAND PANEL (desktop only) ── */}
      <div className="relative z-10 hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${toledoImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-950/88 to-indigo-950/92" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-16">
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

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Welcome back to<br />
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Smart Governance
            </span>
          </h1>
          <p className="text-blue-200 text-lg mb-12 max-w-sm">
            Access your barangay dashboard and manage your community with powerful AI tools.
          </p>

          {/* Feature List */}
          <div className="grid grid-cols-2 gap-4">
            {featureItems.map((item) => (
              <div key={item.label} className="group flex items-center space-x-3 rounded-xl border border-white/15 bg-white/8 backdrop-blur p-3 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-cyan-300/50 hover:bg-white/15 hover:shadow-[0_0_30px_rgba(34,211,238,0.30)] cursor-default">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-cyan-500/20 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.45)]">
                  <item.icon className="w-4 h-4 text-white transition-all duration-300 group-hover:text-cyan-300 group-hover:rotate-6" />
                </div>
                <span className="text-white text-sm font-medium transition-all duration-300 group-hover:text-cyan-200">
  {item.label}
</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-300/60 text-sm">© 2026 SmartCo. All rights reserved.</p>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="relative z-10 flex-1 flex flex-col">
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
          <div className="w-full max-w-md">
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
              <h1 className="text-2xl font-bold text-white">SmartCo</h1>
              <p className="text-blue-100 text-sm">Barangay Management System</p>
            </div>

            {/* Form Card */}
            <div className={`${card} p-8`}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Sign In</h2>
                <p className="text-white/50 text-sm mt-1">Enter your credentials to access your dashboard</p>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Email Address</label>
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

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 transition-all duration-300 group-focus-within:text-cyan-300" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className={`${inputClass} pr-11`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-400"
                    />
                    <span className="text-sm text-white/60">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-blue-300 hover:text-blue-200 font-medium">
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:from-cyan-500 hover:to-blue-600 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 text-white/30 bg-transparent">or</span>
                </div>
              </div>

              <p className="text-center text-sm text-white/60">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-300 hover:text-blue-200 font-semibold">
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage