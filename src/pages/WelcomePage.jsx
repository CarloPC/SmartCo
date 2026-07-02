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

  /* glass card — same design language as HomePage / HealthPage */
 const card =
  'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] hover:border-cyan-300/40 hover:shadow-[0_0_45px_rgba(34,211,238,0.28)] hover:ring-cyan-300/30'

  const features = [
    {
      icon: Heart,
      title: 'Health Care',
      description: 'Track and manage community health records, checkups, and medical alerts in real time.',
      iconBg: 'bg-gradient-to-br from-rose-500 via-pink-500 to-red-500',
      iconRing: 'ring-rose-300/40',
    },
    {
      icon: Package,
      title: 'Food Aid',
      description: 'AI-optimized food distribution scheduling across puroks to ensure fair and timely delivery.',
      iconBg: 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500',
      iconRing: 'ring-emerald-300/40',
    },
    {
      icon: Calendar,
      title: 'Events',
      description: 'Organize and monitor barangay events, sports activities, and community gatherings.',
      iconBg: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500',
      iconRing: 'ring-violet-300/40',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect residents, officials, and admins in one unified, secure platform.',
      iconBg: 'bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500',
      iconRing: 'ring-amber-300/40',
    },
  ]

  const highlights = [
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected with enterprise-grade security standards.',
      iconColor: 'text-emerald-300',
    },
    {
      icon: Zap,
      title: 'AI-Powered Analytics',
      description: 'Smart insights and automated scheduling powered by artificial intelligence.',
      iconColor: 'text-yellow-300',
    },
    {
      icon: Bell,
      title: 'Real-time Alerts',
      description: 'Instant notifications for emergencies, approvals, and community updates.',
      iconColor: 'text-rose-300',
    },
    {
      icon: BarChart3,
      title: 'Live Dashboard',
      description: 'Comprehensive analytics and data visualization for barangay-wide insights.',
      iconColor: 'text-sky-300',
    },
    {
      icon: MapPin,
      title: 'Purok-Level Tracking',
      description: 'Granular data and targeting at the purok level for precise community management.',
      iconColor: 'text-indigo-300',
    },
    {
      icon: Users,
      title: 'Multi-Role Access',
      description: 'Separate portals for residents, barangay officials, and administrators.',
      iconColor: 'text-violet-300',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">

      {/* ── NAVBAR — same glass treatment as Topbar.jsx ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center border-b border-white/10 bg-gradient-to-r from-slate-900/70 via-indigo-900/55 to-blue-950/65 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,.15)]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 left-1/4 h-40 w-40 rounded-full bg-cyan-400/10 blur-[90px]" />
          <div className="absolute -bottom-16 right-1/4 h-40 w-40 rounded-full bg-violet-500/10 blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-blue-500/30 ring-2 ring-white/20">
                S
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight text-white leading-tight">SmartCo</div>
                <div className="text-[11px] font-medium text-white/50 leading-none mt-0.5 hidden sm:block">Barangay Management System</div>
              </div>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="text-white/70 font-medium text-sm px-4 py-2 rounded-xl transition-all duration-300 hover:text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.18)] hover:scale-105"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex items-center justify-center font-semibold text-sm px-5 py-2 rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-white/20 hover:border-cyan-300/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)]"
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
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-950/88 to-indigo-950/92" />
        </div>

        {/* Decorative glow blobs — matches Layout.jsx global gradient treatment */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 mb-8 shadow-lg">
            <Zap className="w-4 h-4 text-yellow-300" />
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

          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A unified digital platform for health tracking, food aid distribution,
            community events, and administrative governance — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:from-cyan-500 hover:to-blue-600 hover:shadow-[0_0_45px_rgba(59,130,246,0.6)] active:scale-95 group text-base"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto border border-white/20 bg-white/10 text-white font-semibold px-8 py-4 rounded-xl backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:bg-white/20 hover:border-cyan-300/50 hover:shadow-[0_0_35px_rgba(34,211,238,0.28)] text-base"
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
              <div key={stat.label} className={`${card} p-4`}>
                <div className="text-white font-bold text-xl sm:text-2xl">{stat.value}</div>
                <div className="text-white/50 text-xs mt-1 uppercase tracking-wider font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <button
            onClick={scrollToFeatures}
           className="flex flex-col items-center space-y-1 text-white/50 transition-all duration-300 hover:text-cyan-300 hover:drop-shadow-[0_0_18px_rgba(34,211,238,0.7)] hover:scale-110 mx-auto group"
          >
            <span className="text-xs">Learn More</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="relative py-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 backdrop-blur-xl rounded-full px-4 py-1.5 mb-4">
              <span className="text-blue-200 text-sm font-medium">Core Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything Your Barangay Needs
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Four powerful modules designed to streamline barangay operations and serve your community better.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`${card} p-6 hover:-translate-y-1`}
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl ring-2 transition-all duration-500 hover:scale-110 hover:rotate-6 hover:shadow-[0_0_35px_rgba(255,255,255,0.35)] ${feature.iconBg} ${feature.iconRing}`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHTS SECTION ── */}
      <section className="relative py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${toledoImage})`, backgroundSize: 'cover' }} />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Modern Governance
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Advanced capabilities to help barangay officials make smarter, faster decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((item) => (
              <div
                key={item.title}
                className={`${card} p-6`}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative py-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`${card} px-8 py-14 text-center`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 ring-2 ring-white/20">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Modernize Your Barangay?
            </h2>
            <p className="text-white/50 text-lg mb-8 max-w-lg mx-auto">
              Join SmartCo today and experience the future of barangay management.
              Free to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:from-blue-500 hover:to-indigo-500 transition shadow-xl shadow-blue-900/40 group text-base"
              >
                <span>Create Your Account</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto border border-white/20 bg-white/10 text-white font-semibold px-8 py-4 rounded-xl backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:border-white/30 text-base"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative border-t border-white/10 py-8 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white/60 font-semibold">SmartCo</span>
            </div>
            <p className="text-white/40 text-sm">
              © 2026 SmartCo. All rights reserved. · Barangay Toledo Management System
            </p>
            <div className="flex items-center space-x-4 text-white/40 text-sm">
              <span className="hover:text-white/70 cursor-pointer transition">Privacy</span>
              <span className="hover:text-white/70 cursor-pointer transition">Terms</span>
              <span className="hover:text-white/70 cursor-pointer transition">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default WelcomePage