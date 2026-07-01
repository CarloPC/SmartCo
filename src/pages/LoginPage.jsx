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

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT BRAND PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${toledoImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/88 to-indigo-950/92" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <div className="relative">
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
              <div key={item.label} className="flex items-center space-x-3 bg-white/8 backdrop-blur border border-white/15 rounded-xl p-3">
                <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-300/60 text-sm">© 2026 SmartCo. All rights reserved.</p>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${toledoImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85" />
          </div>
        </div>

        <div className="relative z-10 flex flex-col flex-1 justify-center items-center p-6 sm:p-10 lg:bg-gray-50 lg:min-h-screen">
          <div className="w-full max-w-md">
            {/* Back button (mobile) */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-white lg:text-gray-600 mb-8 hover:opacity-70 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </button>

            {/* Mobile logo */}
            <div className="text-center mb-8 lg:hidden">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <span className="text-blue-600 font-bold text-2xl">S</span>
              </div>
              <h1 className="text-2xl font-bold text-white">SmartCo</h1>
              <p className="text-blue-100 text-sm">Barangay Management System</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-500 text-sm mt-1">Enter your credentials to access your dashboard</p>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-400">or</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
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
