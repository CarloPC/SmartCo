import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Package, Calendar, Users, AlertCircle, Plus, TrendingUp, Activity, BarChart3, Loader } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
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
        notificationService.getNotifications()
      ])
      const upcomingEvents = events.filter(e => e.status === 'upcoming').length
      const totalFamiliesServed = foodAidSchedules.reduce((sum, item) => sum + (item.deliveredFamilies || 0), 0)
      setStats({ healthRecords: healthRecords.length, aidDistributed: totalFamiliesServed, upcomingEvents, activeUsers: 342 })
      setHealthTrendsData(processHealthTrends(healthRecords))
      setFoodAidData(processFoodAidByPurok(foodAidSchedules))
      setEventAttendanceData(processEventAttendance(events))
      const alerts = notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(n => ({ id: n.id, type: n.category, message: n.message, time: getRelativeTime(n.createdAt), urgent: n.type === 'emergency' }))
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
      const dayRecords = records.filter(r => new Date(r.createdAt).toDateString() === date.toDateString())
      const avgBP = dayRecords.length ? Math.round(dayRecords.reduce((s, r) => s + (parseInt(r.formData?.bloodPressureSystolic) || 0), 0) / dayRecords.length) : 0
      const avgTemp = dayRecords.length ? +(dayRecords.reduce((s, r) => s + (parseFloat(r.formData?.temperature) || 0), 0) / dayRecords.length).toFixed(1) : 0
      return { date: dateStr, avgBP, avgTemp, checkups: dayRecords.length }
    })
  }

  const processFoodAidByPurok = (schedules) => {
    const map = {}
    schedules.forEach(s => {
      const p = s.purok || 'Unknown'
      if (!map[p]) map[p] = { purok: p, families: 0, delivered: 0 }
      map[p].families += s.totalFamilies || 0
      map[p].delivered += s.deliveredFamilies || 0
    })
    return Object.values(map).sort((a, b) => a.purok.localeCompare(b.purok))
  }

  const processEventAttendance = (events) => {
    const map = {}
    events.forEach(e => {
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
      <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-lg p-3`}>
        <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
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

  const statCards = [
    { icon: Heart, label: 'Health Records', value: stats.healthRecords, gradient: 'from-blue-500 to-blue-600', badge: <Activity className="w-4 h-4" /> },
    { icon: Package, label: 'Families Served', value: stats.aidDistributed, gradient: 'from-green-500 to-emerald-600', badge: <TrendingUp className="w-4 h-4" /> },
    { icon: Calendar, label: 'Upcoming Events', value: stats.upcomingEvents, gradient: 'from-purple-500 to-violet-600', badge: <Activity className="w-4 h-4" /> },
    { icon: Users, label: 'Active Users', value: stats.activeUsers, gradient: 'from-orange-500 to-amber-600', badge: <Activity className="w-4 h-4" /> },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div
          className="fixed inset-0 bg-cover bg-center -z-10"
          style={{ backgroundImage: `url(${toledoImage})` }}
        >
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95' : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`} />
        </div>
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95' : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-screen-2xl">

        {/* Welcome Header */}
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/90 to-indigo-950/90 border-gray-700/50' : 'bg-gradient-to-r from-blue-500/90 to-indigo-600/90 border-white/20'} backdrop-blur-sm rounded-2xl p-6 lg:p-8 text-white shadow-xl border`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-1">
                Welcome back, {user?.fullName?.split(' ')[0] || 'User'} 👋
              </h2>
              <p className={`text-sm lg:text-base ${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}>
                Barangay Analytics Dashboard · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${isDarkMode ? 'bg-blue-800/50 text-blue-200' : 'bg-white/20 text-white'}`}>
              🟢 System Online
            </div>
          </div>
        </div>

        {/* Stat Cards — 2 col mobile, 4 col desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`bg-gradient-to-br ${card.gradient} backdrop-blur-sm rounded-2xl p-4 lg:p-5 text-white shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="bg-white/20 rounded-full p-1.5">
                  {card.badge}
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold mb-0.5">{card.value}</div>
              <div className="text-xs lg:text-sm opacity-85">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 — Health Trends + Recent Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
          {/* Health Trends — takes 3/5 on xl */}
          {healthTrendsData.length > 0 && (
            <div className={`xl:col-span-3 ${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border p-5 lg:p-6`}>
              <div className="flex items-center space-x-2 mb-5">
                <div className={`w-8 h-8 ${isDarkMode ? 'bg-blue-900/60' : 'bg-blue-50'} rounded-lg flex items-center justify-center`}>
                  <Activity className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm lg:text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Health Trends</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Past 7 days</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={healthTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
                  <YAxis tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />
                  <Line type="monotone" dataKey="checkups" stroke="#3b82f6" strokeWidth={2.5} name="Checkups" dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="avgBP" stroke="#ef4444" strokeWidth={2.5} name="Avg BP (Systolic)" dot={{ fill: '#ef4444', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Alerts — takes 2/5 on xl */}
          {recentAlerts.length > 0 && (
            <div className={`xl:col-span-2 ${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border p-5 lg:p-6`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 ${isDarkMode ? 'bg-red-900/40' : 'bg-red-50'} rounded-lg flex items-center justify-center`}>
                    <AlertCircle className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm lg:text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Recent Alerts</h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Latest notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/notifications')}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${isDarkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`}
                >
                  View All
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[200px] lg:max-h-none">
                {recentAlerts.map(alert => (
                  <div key={alert.id} className={`flex items-start space-x-3 p-3 rounded-xl ${alert.urgent
                    ? isDarkMode ? 'bg-red-950/50 border border-red-900/50' : 'bg-red-50 border border-red-200'
                    : isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                  }`}>
                    <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.urgent ? 'text-red-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-snug ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{alert.message}</p>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Charts Row 2 — Food Aid + Event Attendance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Food Aid Distribution */}
          {foodAidData.length > 0 && (
            <div className={`${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border p-5 lg:p-6`}>
              <div className="flex items-center space-x-2 mb-5">
                <div className={`w-8 h-8 ${isDarkMode ? 'bg-green-900/40' : 'bg-green-50'} rounded-lg flex items-center justify-center`}>
                  <Package className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm lg:text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Food Aid by Purok</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{deliveryProgress}% distributed</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={foodAidData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                  <XAxis dataKey="purok" tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
                  <YAxis tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} iconType="rect" />
                  <Area type="monotone" dataKey="families" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Total Families" strokeWidth={2} />
                  <Area type="monotone" dataKey="delivered" stroke="#059669" fill="#059669" fillOpacity={0.5} name="Delivered" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div className={`mt-3 px-3 py-2 rounded-xl text-xs ${isDarkMode ? 'bg-green-950/30 text-green-400' : 'bg-green-50 text-green-700'}`}>
                <span className="font-semibold">Progress:</span> {totalDelivered} of {totalFamilies} families served ({deliveryProgress}%)
              </div>
            </div>
          )}

          {/* Event Attendance */}
          {eventAttendanceData.length > 0 && (
            <div className={`${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border p-5 lg:p-6`}>
              <div className="flex items-center space-x-2 mb-5">
                <div className={`w-8 h-8 ${isDarkMode ? 'bg-purple-900/40' : 'bg-purple-50'} rounded-lg flex items-center justify-center`}>
                  <BarChart3 className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm lg:text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Event Attendance</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{attendanceRate}% overall rate</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
                  <YAxis tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} iconType="rect" />
                  <Bar dataKey="expected" fill="#a855f7" name="Expected" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="actual" fill="#7c3aed" name="Actual" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className={`mt-3 px-3 py-2 rounded-xl text-xs ${isDarkMode ? 'bg-purple-950/30 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
                <span className="font-semibold">Attendance Rate:</span> {attendanceRate}% ({totalActual} of {totalExpected} expected)
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={`${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border p-5 lg:p-6`}>
          <h3 className={`font-semibold text-sm lg:text-base mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Record Checkup', path: '/health/record', theme: isDarkMode ? 'bg-blue-900/50 hover:bg-blue-800/70 text-blue-300' : 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
              ...(user?.role === 'admin' || user?.role === 'barangay_official'
                ? [{ label: 'Schedule Aid', path: '/food-aid/optimize', theme: isDarkMode ? 'bg-green-900/50 hover:bg-green-800/70 text-green-300' : 'bg-green-50 hover:bg-green-100 text-green-700' }]
                : []
              ),
              { label: 'Create Event', path: '/events/create', theme: isDarkMode ? 'bg-purple-900/50 hover:bg-purple-800/70 text-purple-300' : 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
              { label: 'Report Emergency', path: '/emergency/report', theme: isDarkMode ? 'bg-red-900/50 hover:bg-red-800/70 text-red-300' : 'bg-red-50 hover:bg-red-100 text-red-700', icon: 'alert' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={`flex items-center justify-center space-x-2 rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${action.theme}`}
              >
                {action.icon === 'alert'
                  ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  : <Plus className="w-4 h-4 flex-shrink-0" />
                }
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
