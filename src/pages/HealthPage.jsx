import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Plus, Activity, Loader2, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import healthService from '../services/healthService'

const HealthPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()

  const [healthStats, setHealthStats] = useState({ total: 0, today: 0, thisWeek: 0, emergencies: 0 })
  const [healthAlerts, setHealthAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealthData = async () => {
    try {
      setIsLoading(true)
      const [stats, alerts] = await Promise.all([
        healthService.getHealthStats(),
        healthService.getRecentHealthAlerts(5)
      ])
      setHealthStats(stats)
      setHealthAlerts(alerts.map(a => ({ ...a, time: getTimeAgo(a.createdAt) })))
    } catch (error) {
      console.error('Error fetching health data:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => { setRefreshing(true); fetchHealthData() }

  useEffect(() => { fetchHealthData() }, [])

  const getTimeAgo = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) > 1 ? 's' : ''} ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`
  }

  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95' : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-screen-xl">
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/90 to-slate-900/90 border-gray-700/50' : 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 border-white/20'} backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold">Health Management</h2>
                <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}>Monitor and record community health data</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className={`p-2.5 rounded-xl transition ${isDarkMode ? 'hover:bg-blue-800/50' : 'hover:bg-blue-600/50'} disabled:opacity-50`}
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={`${card} p-10 text-center`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading health data...</p>
          </div>
        ) : (
          <>
            {/* Stats — 3-col on sm, 4-col on lg */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              {[
                { label: 'Total Records', value: healthStats.total, color: isDarkMode ? 'text-gray-100' : 'text-gray-800' },
                { label: 'Checkups Today', value: healthStats.today, color: isDarkMode ? 'text-gray-100' : 'text-gray-800' },
                { label: 'This Week', value: healthStats.thisWeek, color: 'text-green-500' },
                { label: 'Emergencies', value: healthStats.emergencies, color: 'text-red-500' },
              ].map((s) => (
                <div key={s.label} className={`${card} p-4 lg:p-5 text-center`}>
                  <div className={`text-2xl lg:text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Alerts */}
            {healthAlerts.length > 0 ? (
              <div className="space-y-3">
                {healthAlerts.map(alert => (
                  <div key={alert.id} className={`${card} p-4 lg:p-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${alert.urgent ? isDarkMode ? 'bg-red-950/50' : 'bg-red-100' : isDarkMode ? 'bg-blue-950/50' : 'bg-blue-100'}`}>
                          <AlertCircle className={`w-5 h-5 ${alert.urgent ? isDarkMode ? 'text-red-400' : 'text-red-600' : isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${alert.urgent ? isDarkMode ? 'bg-red-950/50 text-red-400' : 'bg-red-100 text-red-700' : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                              {alert.type}
                            </span>
                            {alert.approvalStatus === 'pending' && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isDarkMode ? 'bg-orange-950/50 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                                <Clock className="w-3 h-3" /><span>Pending</span>
                              </span>
                            )}
                            {alert.approvalStatus === 'approved' && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isDarkMode ? 'bg-green-950/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                                <CheckCircle className="w-3 h-3" /><span>Approved</span>
                              </span>
                            )}
                            {alert.approvalStatus === 'rejected' && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isDarkMode ? 'bg-red-950/50 text-red-400' : 'bg-red-100 text-red-700'}`}>
                                <XCircle className="w-3 h-3" /><span>Rejected</span>
                              </span>
                            )}
                          </div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{alert.message}</p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{alert.time}</p>
                        </div>
                      </div>
                      <button className={`text-sm font-medium flex-shrink-0 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${card} p-10 text-center`}>
                <Activity className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No recent health alerts</p>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => navigate('/health/record')}
          className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-semibold transition shadow-xl border ${isDarkMode ? 'bg-blue-900/90 hover:bg-blue-800 border-gray-700/50 text-white' : 'bg-blue-500/90 hover:bg-blue-600 border-white/20 text-white'}`}
        >
          <Plus className="w-5 h-5" />
          <span>Record New Checkup</span>
        </button>
      </div>
    </div>
  )
}

export default HealthPage
