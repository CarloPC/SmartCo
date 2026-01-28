import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Package, Calendar, Users, AlertCircle, Plus, TrendingUp, TrendingDown, Activity, BarChart3, Loader } from 'lucide-react'
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
  const [stats, setStats] = useState({
    healthRecords: 0,
    aidDistributed: 0,
    upcomingEvents: 0,
    activeUsers: 0
  })
  const [healthTrendsData, setHealthTrendsData] = useState([])
  const [foodAidData, setFoodAidData] = useState([])
  const [eventAttendanceData, setEventAttendanceData] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [
        healthRecords,
        events,
        foodAidSchedules,
        notifications
      ] = await Promise.all([
        healthService.getHealthRecords(),
        eventsService.getEvents(),
        foodAidService.getFoodAidSchedules(),
        notificationService.getNotifications()
      ])

      // Calculate stats
      const upcomingEvents = events.filter(e => e.status === 'upcoming').length
      const totalFamiliesServed = foodAidSchedules.reduce((sum, item) => sum + (item.deliveredFamilies || 0), 0)

      setStats({
        healthRecords: healthRecords.length,
        aidDistributed: totalFamiliesServed,
        upcomingEvents: upcomingEvents,
        activeUsers: 342 // This would come from a user analytics service
      })

      // Process health trends data (last 7 days)
      const trendsData = processHealthTrends(healthRecords)
      setHealthTrendsData(trendsData)

      // Process food aid data by purok
      const foodData = processFoodAidByPurok(foodAidSchedules)
      setFoodAidData(foodData)

      // Process event attendance data
      const attendanceData = processEventAttendance(events)
      setEventAttendanceData(attendanceData)

      // Get recent alerts (last 5 notifications)
      const alerts = notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(notif => ({
          id: notif.id,
          type: notif.category,
          message: notif.message,
          time: getRelativeTime(notif.createdAt),
          urgent: notif.type === 'emergency'
        }))
      setRecentAlerts(alerts)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processHealthTrends = (records) => {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      const dayRecords = records.filter(r => {
        const recordDate = new Date(r.createdAt)
        return recordDate.toDateString() === date.toDateString()
      })

      const avgBP = dayRecords.length > 0
        ? Math.round(dayRecords.reduce((sum, r) => sum + (parseInt(r.formData?.bloodPressureSystolic) || 0), 0) / dayRecords.length)
        : 0

      const avgTemp = dayRecords.length > 0
        ? (dayRecords.reduce((sum, r) => sum + (parseFloat(r.formData?.temperature) || 0), 0) / dayRecords.length).toFixed(1)
        : 0

      last7Days.push({
        date: dateStr,
        avgBP,
        avgTemp: parseFloat(avgTemp),
        checkups: dayRecords.length
      })
    }

    return last7Days
  }

  const processFoodAidByPurok = (schedules) => {
    const purokMap = {}

    schedules.forEach(schedule => {
      const purok = schedule.purok || 'Unknown'
      if (!purokMap[purok]) {
        purokMap[purok] = {
          purok,
          families: 0,
          delivered: 0
        }
      }
      purokMap[purok].families += schedule.totalFamilies || 0
      purokMap[purok].delivered += schedule.deliveredFamilies || 0
    })

    return Object.values(purokMap).sort((a, b) => a.purok.localeCompare(b.purok))
  }

  const processEventAttendance = (events) => {
    const categoryMap = {}

    events.forEach(event => {
      const category = event.category || 'Other'
      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          expected: 0,
          actual: 0
        }
      }
      categoryMap[category].expected += event.expectedAttendees || 0
      categoryMap[category].actual += event.attendees?.length || 0
    })

    return Object.values(categoryMap)
  }

  const getRelativeTime = (timestamp) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diff = Math.floor((now - then) / 1000) // seconds

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
    return then.toLocaleDateString()
  }

  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-lg shadow-lg p-3`}>
          <p className={`text-sm font-semibold mb-1 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Calculate totals for food aid
  const totalFamilies = foodAidData.reduce((sum, item) => sum + item.families, 0)
  const totalDelivered = foodAidData.reduce((sum, item) => sum + item.delivered, 0)
  const deliveryProgress = totalFamilies > 0 ? ((totalDelivered / totalFamilies) * 100).toFixed(1) : 0

  // Calculate event attendance rate
  const totalExpected = eventAttendanceData.reduce((sum, item) => sum + item.expected, 0)
  const totalActual = eventAttendanceData.reduce((sum, item) => sum + item.actual, 0)
  const attendanceRate = totalExpected > 0 ? ((totalActual / totalExpected) * 100).toFixed(1) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10"
        style={{ backgroundImage: `url(${toledoImage})` }}
      >
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95' 
            : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'
        }`}></div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Welcome Header */}
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-blue-900/90 to-indigo-950/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-blue-500/90 to-indigo-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <h2 className="text-2xl font-bold mb-1">Welcome, {user?.fullName?.split(' ')[0] || 'User'}</h2>
          <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}>
            Barangay Analytics Dashboard
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-sm rounded-xl p-4 text-white shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-7 h-7 opacity-90" />
              <div className="flex items-center space-x-1 text-xs bg-white/20 rounded-full px-2 py-1">
                <Activity className="w-3 h-3" />
              </div>
            </div>
            <div className="text-2xl font-bold">{stats.healthRecords}</div>
            <div className="text-xs opacity-90">Health Records</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/90 to-green-600/90 backdrop-blur-sm rounded-xl p-4 text-white shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-7 h-7 opacity-90" />
              <div className="flex items-center space-x-1 text-xs bg-white/20 rounded-full px-2 py-1">
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div className="text-2xl font-bold">{stats.aidDistributed}</div>
            <div className="text-xs opacity-90">Families Served</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/90 to-purple-600/90 backdrop-blur-sm rounded-xl p-4 text-white shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-7 h-7 opacity-90" />
              <div className="flex items-center space-x-1 text-xs bg-white/20 rounded-full px-2 py-1">
                <Activity className="w-3 h-3" />
              </div>
            </div>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <div className="text-xs opacity-90">Upcoming Events</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500/90 to-orange-600/90 backdrop-blur-sm rounded-xl p-4 text-white shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-7 h-7 opacity-90" />
              <div className="flex items-center space-x-1 text-xs bg-white/20 rounded-full px-2 py-1">
                <Activity className="w-3 h-3" />
              </div>
            </div>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <div className="text-xs opacity-90">Active Users</div>
          </div>
        </div>

        {/* Health Trends Chart */}
        {healthTrendsData.length > 0 && (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-xl shadow-xl border p-4`}>
            <div className="flex items-center space-x-2 mb-4">
              <Activity className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Health Trends (Past 7 Days)
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={healthTrendsData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDarkMode ? '#374151' : '#e5e7eb'} 
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                  stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                  stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="checkups" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Checkups"
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgBP" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Avg BP (Systolic)"
                  dot={{ fill: '#ef4444', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Food Aid Distribution Chart */}
        {foodAidData.length > 0 && (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-xl shadow-xl border p-4`}>
            <div className="flex items-center space-x-2 mb-4">
              <Package className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Food Aid Distribution by Purok
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={foodAidData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDarkMode ? '#374151' : '#e5e7eb'} 
                />
                <XAxis 
                  dataKey="purok" 
                  tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                  stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                  stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="rect"
                />
                <Area 
                  type="monotone" 
                  dataKey="families" 
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Total Families"
                />
                <Area 
                  type="monotone" 
                  dataKey="delivered" 
                  stroke="#059669" 
                  fill="#059669"
                  fillOpacity={0.6}
                  name="Delivered"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className={`mt-3 p-2 rounded-lg text-xs ${
              isDarkMode ? 'bg-green-950/30 text-green-400' : 'bg-green-50 text-green-700'
            }`}>
              <span className="font-semibold">Progress:</span> {totalDelivered} of {totalFamilies} families served ({deliveryProgress}%)
            </div>
          </div>
        )}

        {/* Event Attendance Chart */}
        {eventAttendanceData.length > 0 && (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-xl shadow-xl border p-4`}>
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Event Attendance by Category
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventAttendanceData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDarkMode ? '#374151' : '#e5e7eb'} 
                />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                  stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                  stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="rect"
                />
                <Bar 
                  dataKey="expected" 
                  fill="#a855f7" 
                  name="Expected"
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  dataKey="actual" 
                  fill="#7c3aed" 
                  name="Actual"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className={`mt-3 p-2 rounded-lg text-xs ${
              isDarkMode ? 'bg-purple-950/30 text-purple-400' : 'bg-purple-50 text-purple-700'
            }`}>
              <span className="font-semibold">Overall Attendance Rate:</span> {attendanceRate}% ({totalActual} of {totalExpected} expected)
            </div>
          </div>
        )}

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-xl shadow-xl border p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Recent Alerts</h3>
              <button 
                onClick={() => navigate('/notifications')}
                className={`text-sm font-medium ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentAlerts.map(alert => (
                <div key={alert.id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                  alert.urgent 
                    ? isDarkMode ? 'bg-red-950/50 border border-red-900/50' : 'bg-red-50 border border-red-200'
                    : isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${alert.urgent ? 'text-red-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{alert.message}</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-xl shadow-xl border p-4`}>
          <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/health/record')}
              className={`flex items-center justify-center space-x-2 rounded-lg p-4 transition shadow-sm ${
                isDarkMode 
                  ? 'bg-blue-900/50 hover:bg-blue-800/70 text-blue-300' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium text-sm">Record Checkup</span>
            </button>
            <button 
              onClick={() => navigate('/food-aid/optimize')}
              className={`flex items-center justify-center space-x-2 rounded-lg p-4 transition shadow-sm ${
                isDarkMode 
                  ? 'bg-green-900/50 hover:bg-green-800/70 text-green-300' 
                  : 'bg-green-50 hover:bg-green-100 text-green-700'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium text-sm">Schedule Aid</span>
            </button>
            <button 
              onClick={() => navigate('/events/create')}
              className={`flex items-center justify-center space-x-2 rounded-lg p-4 transition shadow-sm ${
                isDarkMode 
                  ? 'bg-purple-900/50 hover:bg-purple-800/70 text-purple-300' 
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium text-sm">Create Event</span>
            </button>
            <button 
              onClick={() => navigate('/health')}
              className={`flex items-center justify-center space-x-2 rounded-lg p-4 transition shadow-sm ${
                isDarkMode 
                  ? 'bg-red-900/50 hover:bg-red-800/70 text-red-300' 
                  : 'bg-red-50 hover:bg-red-100 text-red-700'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium text-sm">Report Emergency</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
