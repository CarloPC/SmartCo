import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, Loader2, CheckCircle, Shield, Zap, Bell } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useAuth } from '../context/AuthContext'

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

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT BRAND PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${toledoImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-indigo-900/88 to-blue-950/92" />
        </div>

        <div className="relative z-10">
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

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Join the Future of<br />
            <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Barangay Governance
            </span>
          </h1>
          <p className="text-blue-200 text-base mb-10 max-w-sm">
            Create your account and start managing community services smarter, faster, and more efficiently.
          </p>

          <div className="space-y-4">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-4 h-4 text-blue-200" />
                </div>
                <span className="text-blue-100 text-sm">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-300/60 text-sm">© 2026 SmartCo. All rights reserved.</p>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${toledoImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85" />
          </div>
        </div>

        <div className="relative z-10 flex flex-col flex-1 justify-center items-center p-6 sm:p-10 lg:bg-gray-50">
          <div className="w-full max-w-md py-8">
            {/* Back button */}
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
              <h1 className="text-2xl font-bold text-white">Create Account</h1>
              <p className="text-blue-100 text-sm">Join SmartCo System</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-500 text-sm mt-1">Fill in your details to get started</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-600">Registration successful! Redirecting to login...</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Email + Phone grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+63 xxx xxx xxxx"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Role + Purok grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                      required
                    >
                      <option value="">Select role</option>
                      <option value="resident">Resident</option>
                      <option value="barangay_official">Barangay Official</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Purok</label>
                    <select
                      name="purok"
                      value={formData.purok}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                      required
                    >
                      <option value="">Select purok</option>
                      <option value="purok1">Purok 1</option>
                      <option value="purok2">Purok 2</option>
                      <option value="purok3">Purok 3</option>
                      <option value="purok4">Purok 4</option>
                      <option value="purok5">Purok 5</option>
                    </select>
                  </div>
                </div>

                {/* Password + Confirm grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                    className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                    required
                  />
                  <label className="text-sm text-gray-600">
                    I agree to the{' '}
                    <span className="text-blue-600 font-medium cursor-pointer hover:underline">Terms and Conditions</span>
                    {' '}and{' '}
                    <span className="text-blue-600 font-medium cursor-pointer hover:underline">Privacy Policy</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating account...</span></>
                  ) : success ? (
                    <><CheckCircle className="w-4 h-4" /><span>Account created!</span></>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
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
