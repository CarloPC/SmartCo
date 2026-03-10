import { useNavigate } from 'react-router-dom'
import {
  Heart, Package, Calendar, Users, ArrowRight,
  Shield, Zap, Bell, ChevronDown, MapPin, BarChart3
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'

const WelcomePage = () => {
  const navigate = useNavigate()

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  const features = [
    {
      icon: Heart,
      title: 'Health Care',
      description: 'Track and manage community health records, checkups, and medical alerts in real time.',
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      icon: Package,
      title: 'Food Aid',
      description: 'AI-optimized food distribution scheduling across puroks to ensure fair and timely delivery.',
      color: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Calendar,
      title: 'Events',
      description: 'Organize and monitor barangay events, sports activities, and community gatherings.',
      color: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect residents, officials, and admins in one unified, secure platform.',
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ]

  const highlights = [
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected with enterprise-grade security standards.',
      iconColor: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      icon: Zap,
      title: 'AI-Powered Analytics',
      description: 'Smart insights and automated scheduling powered by artificial intelligence.',
      iconColor: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      icon: Bell,
      title: 'Real-time Alerts',
      description: 'Instant notifications for emergencies, approvals, and community updates.',
      iconColor: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      icon: BarChart3,
      title: 'Live Dashboard',
      description: 'Comprehensive analytics and data visualization for barangay-wide insights.',
      iconColor: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      icon: MapPin,
      title: 'Purok-Level Tracking',
      description: 'Granular data and targeting at the purok level for precise community management.',
      iconColor: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
    },
    {
      icon: Users,
      title: 'Multi-Role Access',
      description: 'Separate portals for residents, barangay officials, and administrators.',
      iconColor: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md">
                <div className="relative">
                  <span className="text-blue-600 font-bold text-lg leading-none">S</span>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="text-white font-bold text-lg leading-tight">SmartCo</div>
                <div className="text-blue-200 text-xs leading-tight hidden sm:block">Barangay Management System</div>
              </div>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/login')}
                className="text-white font-medium text-sm px-4 py-2 rounded-lg hover:bg-white/10 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-white text-blue-700 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-blue-50 transition shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${toledoImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/88 via-blue-900/85 to-indigo-950/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 mb-8">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm font-medium">Powered by AI Technology</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
            Empowering
            <span className="block bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
              Your Barangay
            </span>
            with Smart Technology
          </h1>

          <p className="text-blue-100 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A unified digital platform for health tracking, food aid distribution,
            community events, and administrative governance — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition shadow-2xl group text-base"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-white/10 backdrop-blur border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition text-base"
            >
              Sign In to Dashboard
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            {[
              { value: '5 Puroks', label: 'Coverage' },
              { value: '342+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Monitoring' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4">
                <div className="text-white font-bold text-xl sm:text-2xl">{stat.value}</div>
                <div className="text-blue-200 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <button
            onClick={scrollToFeatures}
            className="flex flex-col items-center space-y-1 text-blue-200 hover:text-white transition mx-auto group"
          >
            <span className="text-xs">Learn More</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-4">
              <span className="text-blue-600 text-sm font-medium">Core Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Barangay Needs
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Four powerful modules designed to streamline barangay operations and serve your community better.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHTS SECTION ── */}
      <section className="py-20 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${toledoImage})`, backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/90 to-indigo-950/90" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Modern Governance
            </h2>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">
              Advanced capabilities to help barangay officials make smarter, faster decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="bg-white/8 backdrop-blur border border-white/15 rounded-2xl p-6 hover:bg-white/12 transition"
              >
                <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{item.title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Modernize Your Barangay?
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
            Join SmartCo today and experience the future of barangay management.
            Free to get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-xl group text-base"
            >
              <span>Create Your Account</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-gray-100 text-gray-700 font-semibold px-8 py-4 rounded-xl hover:bg-gray-200 transition text-base"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`py-8 bg-gray-950 text-center`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-gray-400 font-semibold">SmartCo</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 SmartCo. All rights reserved. · Barangay Toledo Management System
            </p>
            <div className="flex items-center space-x-4 text-gray-500 text-sm">
              <span className="hover:text-gray-300 cursor-pointer transition">Privacy</span>
              <span className="hover:text-gray-300 cursor-pointer transition">Terms</span>
              <span className="hover:text-gray-300 cursor-pointer transition">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default WelcomePage
