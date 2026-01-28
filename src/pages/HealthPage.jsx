import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Plus, Activity, Loader2, RefreshCw } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import healthService from '../services/healthService'

const HealthPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  
  const [healthStats, setHealthStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    emergencies: 0
  })
  const [healthAlerts, setHealthAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealthData = async () => {
    try {
      setIsLoading(true)
      
      console.log('Fetching health data...')
      
      // Fetch health stats and alerts in parallel
      const [stats, alerts] = await Promise.all([
        healthService.getHealthStats(),
        healthService.getRecentHealthAlerts(5)
      ])
      
      console.log('Health stats:', stats)
      console.log('Health alerts:', alerts)
      
      setHealthStats(stats)
      
      // Format alerts with time ago
      const formattedAlerts = alerts.map(alert => ({
        ...alert,
        time: getTimeAgo(alert.createdAt)
      }))
      
      setHealthAlerts(formattedAlerts)
    } catch (error) {
      console.error('Error fetching health data:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchHealthData()
  }

  useEffect(() => {
    fetchHealthData()
  }, [])

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const created = new Date(timestamp)
    const diffMs = now - created
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
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

      <div className="p-4 space-y-4">
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-blue-900/90 to-slate-900/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6" />
              <h2 className="text-xl font-bold">Health Management</h2>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className={`p-2 rounded-lg transition ${
                isDarkMode 
                  ? 'hover:bg-blue-800/50' 
                  : 'hover:bg-blue-600/50'
              } disabled:opacity-50`}
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className={isDarkMode ? 'text-blue-200' : 'text-blue-100'}>Monitor and record community health data</p>
        </div>

        {isLoading ? (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-lg p-8 border text-center shadow-lg`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${
              isDarkMode ? 'text-blue-400' : 'text-blue-500'
            }`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading health data...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className={`${
                isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
              } backdrop-blur-lg rounded-lg p-4 border text-center shadow-lg`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {healthStats.today}
                </div>
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Checkups Today</div>
              </div>
              <div className={`${
                isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
              } backdrop-blur-lg rounded-lg p-4 border text-center shadow-lg`}>
                <div className="text-2xl font-bold text-red-500">{healthStats.emergencies}</div>
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Emergencies</div>
              </div>
              <div className={`${
                isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
              } backdrop-blur-lg rounded-lg p-4 border text-center shadow-lg`}>
                <div className="text-2xl font-bold text-green-500">{healthStats.thisWeek}</div>
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>This Week</div>
              </div>
            </div>

            {healthAlerts.length > 0 ? (
              <div className="space-y-3">
                {healthAlerts.map(alert => (
                  <div key={alert.id} className={`${
                    isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                  } backdrop-blur-lg rounded-lg shadow-xl border p-4`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${
                          alert.urgent 
                            ? isDarkMode ? 'bg-red-950/50' : 'bg-red-100' 
                            : isDarkMode ? 'bg-blue-950/50' : 'bg-blue-100'
                        }`}>
                          <AlertCircle className={`w-5 h-5 ${
                            alert.urgent 
                              ? isDarkMode ? 'text-red-400' : 'text-red-600' 
                              : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              alert.urgent 
                                ? isDarkMode ? 'bg-red-950/50 text-red-400' : 'bg-red-100 text-red-700' 
                                : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {alert.type}
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            {alert.message}
                          </p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {alert.time}
                          </p>
                        </div>
                      </div>
                      <button className={`text-sm font-medium ml-2 ${
                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${
                isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
              } backdrop-blur-lg rounded-lg shadow-xl border p-6 text-center`}>
                <Activity className={`w-12 h-12 mx-auto mb-3 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No recent health alerts
                </p>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => navigate('/health/record')}
          className={`w-full ${
            isDarkMode 
              ? 'bg-blue-900/90 hover:bg-blue-800 border-gray-700/50' 
              : 'bg-blue-500/90 hover:bg-blue-600 border-white/20'
          } backdrop-blur-sm text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-xl border`}
        >
          <Plus className="w-5 h-5" />
          <span>Record New Checkup</span>
        </button>
      </div>
    </div>
  )
}

export default HealthPage
