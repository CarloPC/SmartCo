import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Shield, Zap, Users, Globe, Award, Sparkles } from 'lucide-react'
import BARANGAY_CONFIG from '../config/barangayConfig'

const AboutPage = () => {
  const navigate = useNavigate()

  const features = [
    { icon: Heart, title: 'Health Management', description: 'Mobile-based health checkup recording and emergency reporting' },
    { icon: Globe, title: 'AI-Powered Distribution', description: 'Intelligent food aid distribution scheduling per purok' },
    { icon: Users, title: 'Volunteer Management', description: 'Optimized task and route assignment for volunteers' },
    { icon: Zap, title: 'Event Scheduling', description: 'Community and sports event scheduling with participant management' },
    { icon: Shield, title: 'Real-time Alerts', description: 'Instant notifications and alerts for community members' },
    { icon: Award, title: 'Centralized Dashboard', description: 'Monitor health, food aid, and events in one place' },
  ]

  const stack = [
    { name: 'React', tag: 'Frontend' },
    { name: 'Tailwind CSS', tag: 'Styling' },
    { name: 'AI/ML', tag: 'Optimization' },
    { name: 'Cloud', tag: 'Infrastructure' },
  ]

  const team = [
    { name: 'Development Team', role: 'Capstone Project 2026' },
    { name: 'Toledo City', role: 'Barangay Management' },
    { name: 'Community Partners', role: 'Local Organizations' },
  ]

  const legalLinks = ['Privacy Policy', 'Terms of Service', 'License Information']

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
        <h1 className="text-xl font-bold text-white">About SmartCo</h1>
        <div className="w-10" />
      </div>

      {/* Logo & App Info */}
      <div className={`${card} p-6 text-center`}>
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-5xl font-bold text-white shadow-xl ring-2 ring-sky-300/40">
          S
        </div>
        <h2 className="mb-1 text-2xl font-bold text-white">SmartCo</h2>
        <p className="text-white/70">{BARANGAY_CONFIG.applicationTagline}</p>
        <p className="text-sm text-white/40">For Barangay Ilihan, Toledo City, Cebu</p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
          Powered by AI Technology
        </div>
      </div>

      {/* Mission */}
      <div className={`${card} p-6`}>
        {sectionHeader(Heart, 'Why we exist', 'Our Mission')}
        <p className="leading-relaxed text-white/70">
          SmartCo was developed specifically for Barangay Ilihan, Toledo City, Cebu to revolutionize
          local barangay management through technology. We aim to streamline health services, food aid distribution,
          and community engagement by leveraging AI-powered solutions to create a more efficient, transparent, and
          responsive governance system for our Barangay Ilihan residents.
        </p>
      </div>

      {/* Key Features */}
      <div className={`${card} p-6`}>
        {sectionHeader(Zap, 'What it does', 'Key Features')}
        <div className="grid grid-cols-1 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <feature.icon className="h-4 w-4 text-blue-200" />
              </div>
              <div>
                <p className="font-semibold text-white">{feature.title}</p>
                <p className="mt-0.5 text-sm text-white/60">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className={`${card} p-6`}>
        {sectionHeader(Globe, 'Under the hood', 'Built With')}
        <div className="grid grid-cols-2 gap-3">
          {stack.map((item) => (
            <div key={item.name} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="font-semibold text-white">{item.name}</p>
              <p className="text-xs text-white/40">{item.tag}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className={`${card} p-6`}>
        {sectionHeader(Users, 'Behind the project', 'Created By')}
        <div className="space-y-3">
          {team.map((member, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 font-bold text-white shadow-lg ring-2 ring-sky-300/40">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white">{member.name}</p>
                <p className="text-sm text-white/60">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal & Contact */}
      <div className={`${card} p-6`}>
        {sectionHeader(Shield, 'Fine print', 'Legal & Contact')}
        <div className="space-y-2">
          {legalLinks.map((label) => (
            <button
              key={label}
              className="w-full rounded-lg p-3 text-left text-sm font-medium text-blue-200 transition hover:bg-white/10"
            >
              {label}
            </button>
          ))}
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
            <p><span className="font-semibold text-white">Contact:</span> {BARANGAY_CONFIG.contactEmail}</p>
            <p className="mt-1"><span className="font-semibold text-white">Location:</span> {BARANGAY_CONFIG.fullAddress}</p>
            <p className="mt-1"><span className="font-semibold text-white">Health Center:</span> {BARANGAY_CONFIG.healthCenterName}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center">
        <p className="text-sm text-white/50">© 2026 SmartCo. All rights reserved.</p>
        <p className="mt-1 text-xs text-blue-200/70">Developed with heart for Barangay Ilihan, Toledo City, Cebu</p>
      </div>
    </div>
  )
}

export default AboutPage