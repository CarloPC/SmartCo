import FoodAidProjectionChart from '../components/FoodAidProjectionChart'
import EventAttendanceChart from '../components/EventAttendanceChart'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, Package, Calendar, Users, AlertCircle,
  Activity, BarChart3, Loader, ArrowRight,
  Sparkles, ShieldCheck, Clock3, MapPin,
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import healthService from '../services/healthService'
import eventsService from '../services/eventsService'
import foodAidService from '../services/foodAidService'
import notificationService from '../services/notificationService'

const HomePage = () => {
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ healthRecords: 0, aidDistributed: 0, upcomingEvents: 0, activeUsers: 0 })
  const [healthTrendsData, setHealthTrendsData] = useState([])
  const [foodAidData, setFoodAidData] = useState([])
  const [eventAttendanceData, setEventAttendanceData] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [healthRecords, events, foodAidSchedules, notifications] = await Promise.all([
        healthService.getHealthRecords(),
        eventsService.getEvents(),
        foodAidService.getFoodAidSchedules(),
        notificationService.getNotifications(),
      ])
      const upcomingEvents = events.filter((e) => e.status === 'upcoming').length
      const totalFamiliesServed = foodAidSchedules.reduce((sum, item) => sum + (item.deliveredFamilies || 0), 0)
      setStats({ healthRecords: healthRecords.length, aidDistributed: totalFamiliesServed, upcomingEvents, activeUsers: 342 })
      setHealthTrendsData(processHealthTrends(healthRecords))
      setFoodAidData(processFoodAidByPurok(foodAidSchedules))
      setEventAttendanceData(processEventAttendance(events))
      const alerts = notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((n) => ({ id: n.id, type: n.category, message: n.message, time: getRelativeTime(n.createdAt), urgent: n.type === 'emergency' }))
      setRecentAlerts(alerts)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processHealthTrends = (records) => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - (6 - i))
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const dayRecords = records.filter((r) => new Date(r.createdAt).toDateString() === date.toDateString())
      const avgBP = dayRecords.length ? Math.round(dayRecords.reduce((s, r) => s + (parseInt(r.formData?.bloodPressureSystolic) || 0), 0) / dayRecords.length) : 0
      const avgTemp = dayRecords.length ? +(dayRecords.reduce((s, r) => s + (parseFloat(r.formData?.temperature) || 0), 0) / dayRecords.length).toFixed(1) : 0
      return { date: dateStr, avgBP, avgTemp, checkups: dayRecords.length }
    })
  }

  const processFoodAidByPurok = (schedules) => {
    const map = {}
    schedules.forEach((s) => {
      const p = s.purok || 'Unknown'
      if (!map[p]) map[p] = { purok: p, families: 0, delivered: 0 }
      map[p].families += s.totalFamilies || 0
      map[p].delivered += s.deliveredFamilies || 0
    })
    return Object.values(map).sort((a, b) => a.purok.localeCompare(b.purok))
  }

  const processEventAttendance = (events) => {
    const map = {}
    events.forEach((e) => {
      const c = e.category || 'Other'
      if (!map[c]) map[c] = { category: c, expected: 0, actual: 0 }
      map[c].expected += e.expectedAttendees || 0
      map[c].actual += e.attendees?.length || 0
    })
    return Object.values(map)
  }

  const getRelativeTime = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-xl border border-white/25 bg-indigo-900/70 p-3 shadow-lg backdrop-blur-xl">
        <p className="mb-1 text-xs font-bold text-white/60 uppercase tracking-wider">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }

  const totalFamilies = foodAidData.reduce((s, i) => s + i.families, 0)
  const totalDelivered = foodAidData.reduce((s, i) => s + i.delivered, 0)
  const deliveryProgress = totalFamilies > 0 ? ((totalDelivered / totalFamilies) * 100).toFixed(1) : 0
  const totalExpected = eventAttendanceData.reduce((s, i) => s + i.expected, 0)
  const totalActual = eventAttendanceData.reduce((s, i) => s + i.actual, 0)
  const attendanceRate = totalExpected > 0 ? ((totalActual / totalExpected) * 100).toFixed(1) : 0
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  /* glass card â€” used on every panel */
 const card =
  'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 transition-all duration-300 hover:border-white/40 hover:shadow-blue-500/10'
  const statCards = [
  {
    icon: Heart,
    label: 'Health Records',
    value: stats.healthRecords,
    iconBg:
      'bg-gradient-to-br from-rose-500 via-pink-500 to-red-500',
    iconColor: 'text-white',
    iconRing: 'ring-rose-300/40',
  },
  {
    icon: Package,
    label: 'Families Served',
    value: stats.aidDistributed,
    iconBg:
      'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500',
    iconColor: 'text-white',
    iconRing: 'ring-emerald-300/40',
  },
  {
    icon: Calendar,
    label: 'Upcoming Events',
    value: stats.upcomingEvents,
    iconBg:
      'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500',
    iconColor: 'text-white',
    iconRing: 'ring-violet-300/40',
  },
  {
    icon: Users,
    label: 'Active Users',
    value: stats.activeUsers,
    iconBg:
      'bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-500',
    iconColor: 'text-white',
    iconRing: 'ring-amber-300/40',
  },
]

  const quickActions = [
  {
    label: 'Record Checkup',
    description: 'Log a new resident health update',
    path: '/health/record',
    icon: Heart,
    gradient: 'from-sky-500/60 via-blue-500/40 to-cyan-600/25',
    glow: 'hover:shadow-sky-500/30',
  },

  ...(user?.role === 'admin' || user?.role === 'barangay_official'
    ? [{
        label: 'Schedule Aid',
        description: 'Plan next food aid distribution',
        path: '/food-aid/optimize',
        icon: Package,
        gradient: 'from-emerald-500/60 via-green-500/40 to-teal-600/25',
        glow: 'hover:shadow-emerald-500/30',
      }]
    : []),

  {
    label: 'Create Event',
    description: 'Publish a barangay activity',
    path: '/events/create',
    icon: Calendar,
    gradient: 'from-violet-500/60 via-fuchsia-500/40 to-purple-700/25',
    glow: 'hover:shadow-violet-500/30',
  },

  {
    label: 'Report Emergency',
    description: 'Send a fast community alert',
    path: '/emergency/report',
    icon: AlertCircle,
    gradient: 'from-rose-500/60 via-red-500/40 to-orange-600/25',
    glow: 'hover:shadow-rose-500/30',
  },
]

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
          <div className={`absolute inset-0 ${isDarkMode
            ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
            : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
          />
        </div>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className={`${card} px-8 py-10 text-center`}>
            <Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-white" />
            <p className="font-semibold text-white">Loading your community dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95'
          : 'bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-blue-800/90'}`}
        />
      </div>

      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">

      {/* â”€â”€ Hero welcome banner â”€â”€ */}
     <section
  className={`${card} overflow-hidden bg-gradient-to-r from-indigo-500/30 via-violet-500/20 to-blue-500/30`}
>
        <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              AI-powered barangay overview
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {greeting}, {user?.fullName?.split(' ')[0] || 'there'} 😊
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
              Keep tabs on health updates, food aid progress, and community events  all in one modern dashboard.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/health')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-white shadow-lg hover:from-blue-600 hover:to-indigo-700 text-sm font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50 hover:shadow-lg"
              >
                Record checkup <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/notifications')}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
              >
                Review alerts
              </button>
            </div>
          </div>

          {/* At-a-glance mini panel */}
          <div className="flex w-full max-w-xs flex-col gap-3 lg:w-auto">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">Today at a glance</p>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/30 bg-gradient-to-br from-blue-500/25 to-cyan-500/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> Coverage
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{deliveryProgress}%</p>
              </div>
              <div className="rounded-xl border border-white/30 bg-gradient-to-br from-violet-500/25 to-purple-500/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-200">
                  <Clock3 className="h-3.5 w-3.5" /> Attendance
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{attendanceRate}%</p>
              </div>
            </div>
            <p className="text-center text-xs text-white/40">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* â”€â”€ Stat cards â”€â”€ */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((c) => (
          <div
  key={c.label}
  className={`${card} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(59,130,246,.25)] hover:border-white/40`}
>
            <div
  className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl ring-2 transition-transform duration-300 group-hover:scale-110 ${c.iconBg} ${c.iconRing}`}
>
              <c.icon className={`h-5 w-5 ${c.iconColor}`} />
            </div>
            <div className="text-3xl font-bold tracking-tight text-white">{c.value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/50">{c.label}</div>
          </div>
        ))}
      </section>

      {/* â”€â”€ Health trend + Alerts â”€â”€ */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.9fr]">

        <div className={`${card} p-5 lg:p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
              <Activity className="h-4 w-4 text-sky-200" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Community health trend</p>
              <p className="text-base font-semibold text-white">Weekly pulse of resident checkups</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={healthTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} iconType="line" />
              <Line type="monotone" dataKey="checkups" stroke="#93c5fd" strokeWidth={2.5} name="Checkups" dot={{ fill: '#93c5fd', r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="avgBP"    stroke="#fca5a5" strokeWidth={2.5} name="Avg BP"   dot={{ fill: '#fca5a5', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`${card} p-5 lg:p-6`}>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/30">
                <AlertCircle className="h-4 w-4 text-rose-200" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">Priority alerts</p>
                <p className="text-base font-semibold text-white">Latest updates</p>
              </div>
            </div>
            <button onClick={() => navigate('/notifications')} className="text-xs font-bold uppercase tracking-wider text-blue-200 transition hover:text-white">
              View all
            </button>
          </div>
          {recentAlerts.length > 0 ? (
            <div className="divide-y divide-white/10">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${alert.urgent ? 'animate-pulse bg-rose-400' : 'bg-white/30'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-medium leading-5 text-white">{alert.message}</p>
                      {alert.urgent && (
                        <span className="flex-shrink-0 rounded-full border border-rose-300/30 bg-rose-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                      <MapPin className="h-3 w-3" />{alert.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/20 p-5 text-center text-sm text-white/40">
              No recent alerts. New notifications will appear here.
            </div>
          )}
        </div>
      </section>

      {/* â”€â”€ Charts â”€â”€ */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        <div className={`${card} p-5 lg:p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
              <Package className="h-4 w-4 text-emerald-200" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Food aid distribution</p>
              <p className="text-base font-semibold text-white">{deliveryProgress}% of families reached</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={foodAidData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="purok"    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
              <YAxis                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} iconType="rect" />
              <Area type="monotone" dataKey="families"  stroke="#6ee7b7" fill="#6ee7b7" fillOpacity={0.15} name="Families"  strokeWidth={2} />
              <Area type="monotone" dataKey="delivered" stroke="#34d399" fill="#34d399" fillOpacity={0.35} name="Delivered" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/60">
            <span className="font-semibold text-white">Progress:</span> {totalDelivered} of {totalFamilies} families served
          </div>
        </div>

        <div className={`${card} p-5 lg:p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
              <BarChart3 className="h-4 w-4 text-violet-200" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Event attendance</p>
              <p className="text-base font-semibold text-white">{attendanceRate}% overall turnout</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eventAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
              <YAxis                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} iconType="rect" />
              <Bar dataKey="expected" fill="rgba(167,139,250,0.5)" name="Expected" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual"   fill="#a78bfa"              name="Actual"   radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/60">
            <span className="font-semibold text-white">Attendance:</span> {totalActual} of {totalExpected} expected participants
          </div>
        </div>
      </section>

      {/* â”€â”€ Quick actions â”€â”€ */}
      <section
  className={`${card} bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-violet-500/15 p-5 lg:p-6`}
>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/50">Quick actions</p>
          <p className="mt-0.5 text-base font-semibold text-white">Jump into the most-used tasks</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
  key={action.label}
  onClick={() => navigate(action.path)}
  className={`
group
relative
overflow-hidden
rounded-3xl
border
${action.border}
bg-gradient-to-br
${action.gradient}
p-5
text-left
backdrop-blur-xl
shadow-xl
transition-all
duration-500
hover:-translate-y-2
hover:scale-[1.04]
hover:shadow-[0_20px_80px_rgba(0,0,0,.35)]
`}
>

  {/* Glow */}
  <div
    className="
absolute
-inset-20
opacity-40
blur-3xl
group-hover:opacity-70
transition-all
duration-500
bg-gradient-to-br
from-white/20
to-transparent
"
  />

  {/* Shine */}
  <div
    className="
absolute
inset-0
opacity-0
group-hover:opacity-100
transition
duration-700
bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_55%)]
"
  />

  <div className="relative z-10">

    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 border border-white/20 backdrop-blur-xl shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
      <Icon className="h-5 w-5 text-white" />
    </div>

    <p className="font-bold text-white">
      {action.label}
    </p>

    <p className="mt-2 text-sm text-white/70">
      {action.description}
    </p>

    <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70 group-hover:text-white">
      OPEN
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </div>

  </div>

</button>
            )
          })}
        </div>
      </section>

      </div>
    </div>
  )
}

export default HomePage