import { useState, useEffect } from 'react'
import {
  AlertCircle, Activity, Loader2, RefreshCw,
  CheckCircle, Clock, XCircle, Sparkles, ChevronDown, ChevronUp, Heart, Eye
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import healthService from '../services/healthService'
import HealthAIChat from '../components/HealthAIChat'
import HealthRecordModal from '../components/HealthRecordModal'

const HealthPage = () => {
  const { isDarkMode } = useTheme()

  const [healthStats, setHealthStats]   = useState({ total: 0, today: 0, thisWeek: 0, emergencies: 0 })
  const [healthAlerts, setHealthAlerts] = useState([])
  const [isLoading, setIsLoading]       = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [chatOpen, setChatOpen]         = useState(false)
  const [viewRecord, setViewRecord]     = useState(null)
  const [viewLoading, setViewLoading]   = useState(null) // holds the id being loaded

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

  const handleViewRecord = async (alert) => {
    setViewLoading(alert.id)
    try {
      const record = await healthService.getHealthRecordById(alert.id)
      setViewRecord(record)
    } catch (err) {
      console.error('Error fetching record:', err)
    } finally {
      setViewLoading(null)
    }
  }

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
        <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95'
          : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`}
        />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-screen-xl">

        {/* ── Page Header ── */}
        <div className={`${isDarkMode
          ? 'bg-gradient-to-r from-blue-900/90 to-slate-900/90 border-gray-700/50'
          : 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 border-white/20'
        } backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold">Health Management</h2>
                <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}>
                  Monitor community health and chat with AI for guidance
                </p>
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

        {/* ── AI Health Assistant Banner / Chat ── */}
        <div>
          {!chatOpen ? (
            /* Collapsed banner */
            <button
              onClick={() => setChatOpen(true)}
              className={`w-full text-left ${isDarkMode
                ? 'bg-gradient-to-r from-green-900/80 to-teal-900/80 border-green-800/40 hover:from-green-900/90 hover:to-teal-900/90'
                : 'bg-gradient-to-r from-green-50 to-teal-50 border-green-200 hover:from-green-100 hover:to-teal-100'
              } border rounded-2xl p-5 transition shadow-lg group`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                    isDarkMode ? 'bg-green-800/60' : 'bg-green-500'
                  }`}>
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-base ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
                        AI Health Assistant
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        isDarkMode ? 'bg-green-800/60 text-green-300' : 'bg-green-200 text-green-700'
                      }`}>
                        <Sparkles className="w-2.5 h-2.5" /> Powered by Groq
                      </span>
                    </div>
                    <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-green-300/70' : 'text-green-700'}`}>
                      Describe your symptoms and get AI-powered health guidance &amp; checkup scheduling
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 flex-shrink-0 transition group-hover:translate-y-0.5 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
            </button>
          ) : (
            /* Expanded chat */
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <span className={`font-semibold text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    AI Health Assistant
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                  }`}>
                    <Sparkles className="w-2.5 h-2.5" /> Groq AI
                  </span>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className={`flex items-center gap-1 text-xs transition ${
                    isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <ChevronUp className="w-3.5 h-3.5" /> Minimize
                </button>
              </div>
              <HealthAIChat onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        {isLoading ? (
          <div className={`${card} p-10 text-center`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading health data…</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
              {[
                { label: 'Total Records',   value: healthStats.total,       color: isDarkMode ? 'text-gray-100' : 'text-gray-800' },
                { label: 'Checkups Today',  value: healthStats.today,       color: isDarkMode ? 'text-gray-100' : 'text-gray-800' },
                { label: 'This Week',       value: healthStats.thisWeek,    color: 'text-green-500' },
                { label: 'Emergencies',     value: healthStats.emergencies, color: 'text-red-500' },
              ].map((s) => (
                <div key={s.label} className={`${card} p-4 lg:p-5 text-center`}>
                  <div className={`text-2xl lg:text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Recent Alerts ── */}
            {healthAlerts.length > 0 ? (
              <div className="space-y-3">
                {healthAlerts.map(alert => (
                  <div key={alert.id} className={`${card} p-4 lg:p-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${
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
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                              alert.urgent
                                ? isDarkMode ? 'bg-red-950/50 text-red-400' : 'bg-red-100 text-red-700'
                                : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
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
                      <button
                        onClick={() => handleViewRecord(alert)}
                        disabled={viewLoading === alert.id}
                        className={`flex items-center gap-1.5 text-sm font-medium flex-shrink-0 px-3 py-1.5 rounded-lg transition ${
                          isDarkMode
                            ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30'
                            : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        } disabled:opacity-50`}
                      >
                        {viewLoading === alert.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Eye className="w-3.5 h-3.5" />
                        }
                        View
                      </button>
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


      </div>

      {/* ── Health Record Detail Modal ── */}
      <HealthRecordModal
        record={viewRecord}
        isOpen={!!viewRecord}
        onClose={() => setViewRecord(null)}
      />
    </div>
  )
}

export default HealthPage
