import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Activity, Package, Calendar, Loader2, AlertCircle, User } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import adminService from '../services/adminService'

const AdminApprovalsPage = () => {
  const { isDarkMode } = useTheme()
  
  const [activeTab, setActiveTab] = useState('health')
  const [healthRecords, setHealthRecords] = useState([])
  const [foodAidSchedules, setFoodAidSchedules] = useState([])
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchPendingApprovals()
  }, [])

  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true)
      const [health, foodAid, eventsData] = await Promise.all([
        adminService.getPendingHealthRecords(),
        adminService.getPendingFoodAidSchedules(),
        adminService.getPendingEvents()
      ])
      
      setHealthRecords(health)
      setFoodAidSchedules(foodAid)
      setEvents(eventsData)
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveHealth = async (id) => {
    try {
      setActionLoading(id)
      await adminService.approveHealthRecord(id)
      setHealthRecords(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error approving health record:', error)
      alert('Failed to approve health record')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectHealth = async (id) => {
    const reason = prompt('Reason for rejection (optional):')
    try {
      setActionLoading(id)
      await adminService.rejectHealthRecord(id, reason || '')
      setHealthRecords(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error rejecting health record:', error)
      alert('Failed to reject health record')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveFoodAid = async (id) => {
    try {
      setActionLoading(id)
      await adminService.approveFoodAidSchedule(id)
      setFoodAidSchedules(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error approving food aid schedule:', error)
      alert('Failed to approve food aid schedule')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectFoodAid = async (id) => {
    const reason = prompt('Reason for rejection (optional):')
    try {
      setActionLoading(id)
      await adminService.rejectFoodAidSchedule(id, reason || '')
      setFoodAidSchedules(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error rejecting food aid schedule:', error)
      alert('Failed to reject food aid schedule')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveEvent = async (id) => {
    try {
      setActionLoading(id)
      await adminService.approveEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      console.error('Error approving event:', error)
      alert('Failed to approve event')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectEvent = async (id) => {
    const reason = prompt('Reason for rejection (optional):')
    try {
      setActionLoading(id)
      await adminService.rejectEvent(id, reason || '')
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      console.error('Error rejecting event:', error)
      alert('Failed to reject event')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
        {/* Header */}
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-orange-900/90 to-red-950/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-orange-500/90 to-red-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3 mb-2">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Pending Approvals</h2>
          </div>
          <p className={isDarkMode ? 'text-orange-200' : 'text-orange-100'}>
            Review and approve submitted records
          </p>
        </div>

        {/* Tabs */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-lg border shadow-lg`}>
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('health')}
              className={`flex-1 py-3 px-4 font-medium flex items-center justify-center space-x-2 transition ${
                activeTab === 'health'
                  ? isDarkMode
                    ? 'border-b-2 border-blue-400 text-blue-400'
                    : 'border-b-2 border-blue-600 text-blue-600'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Health ({healthRecords.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('foodaid')}
              className={`flex-1 py-3 px-4 font-medium flex items-center justify-center space-x-2 transition ${
                activeTab === 'foodaid'
                  ? isDarkMode
                    ? 'border-b-2 border-green-400 text-green-400'
                    : 'border-b-2 border-green-600 text-green-600'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Food Aid ({foodAidSchedules.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-3 px-4 font-medium flex items-center justify-center space-x-2 transition ${
                activeTab === 'events'
                  ? isDarkMode
                    ? 'border-b-2 border-purple-400 text-purple-400'
                    : 'border-b-2 border-purple-600 text-purple-600'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Events ({events.length})</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-lg p-8 border text-center shadow-lg`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${
              isDarkMode ? 'text-orange-400' : 'text-orange-500'
            }`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading approvals...
            </p>
          </div>
        ) : (
          <>
            {/* Health Records Tab */}
            {activeTab === 'health' && (
              <div className="space-y-3">
                {healthRecords.length > 0 ? (
                  healthRecords.map(record => (
                    <div key={record.id} className={`${
                      isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                    } backdrop-blur-lg rounded-lg shadow-xl border p-4`}>
                      <div className="mb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                              Health Checkup Record
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatDate(record.createdAt)}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            isDarkMode ? 'bg-orange-950/50 text-orange-400' : 'bg-orange-100 text-orange-700'
                          }`}>
                            Pending
                          </span>
                        </div>
                        {record.healthAssessment?.vitalsSummary && (
                          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {record.healthAssessment.vitalsSummary}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveHealth(record.id)}
                          disabled={actionLoading === record.id}
                          className={`flex-1 font-medium py-2 rounded-lg text-sm transition flex items-center justify-center space-x-2 ${
                            isDarkMode 
                              ? 'bg-green-950/50 hover:bg-green-900/70 text-green-300' 
                              : 'bg-green-50 hover:bg-green-100 text-green-700'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === record.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectHealth(record.id)}
                          disabled={actionLoading === record.id}
                          className={`flex-1 font-medium py-2 rounded-lg text-sm transition flex items-center justify-center space-x-2 ${
                            isDarkMode 
                              ? 'bg-red-950/50 hover:bg-red-900/70 text-red-300' 
                              : 'bg-red-50 hover:bg-red-100 text-red-700'
                          } disabled:opacity-50`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${
                    isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                  } backdrop-blur-lg rounded-lg shadow-xl border p-6 text-center`}>
                    <Activity className={`w-12 h-12 mx-auto mb-3 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No pending health records
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Food Aid Tab */}
            {activeTab === 'foodaid' && (
              <div className="space-y-3">
                {foodAidSchedules.length > 0 ? (
                  foodAidSchedules.map(schedule => (
                    <div key={schedule.id} className={`${
                      isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                    } backdrop-blur-lg rounded-lg shadow-xl border p-4`}>
                      <div className="mb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                              {schedule.purok}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {schedule.date} • {schedule.totalFamilies} families
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            isDarkMode ? 'bg-orange-950/50 text-orange-400' : 'bg-orange-100 text-orange-700'
                          }`}>
                            Pending
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveFoodAid(schedule.id)}
                          disabled={actionLoading === schedule.id}
                          className={`flex-1 font-medium py-2 rounded-lg text-sm transition flex items-center justify-center space-x-2 ${
                            isDarkMode 
                              ? 'bg-green-950/50 hover:bg-green-900/70 text-green-300' 
                              : 'bg-green-50 hover:bg-green-100 text-green-700'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === schedule.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectFoodAid(schedule.id)}
                          disabled={actionLoading === schedule.id}
                          className={`flex-1 font-medium py-2 rounded-lg text-sm transition flex items-center justify-center space-x-2 ${
                            isDarkMode 
                              ? 'bg-red-950/50 hover:bg-red-900/70 text-red-300' 
                              : 'bg-red-50 hover:bg-red-100 text-red-700'
                          } disabled:opacity-50`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${
                    isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                  } backdrop-blur-lg rounded-lg shadow-xl border p-6 text-center`}>
                    <Package className={`w-12 h-12 mx-auto mb-3 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No pending food aid schedules
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-3">
                {events.length > 0 ? (
                  events.map(event => (
                    <div key={event.id} className={`${
                      isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                    } backdrop-blur-lg rounded-lg shadow-xl border p-4`}>
                      <div className="mb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                              {event.title}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {event.date} • {event.venue}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            isDarkMode ? 'bg-orange-950/50 text-orange-400' : 'bg-orange-100 text-orange-700'
                          }`}>
                            Pending
                          </span>
                        </div>
                        {event.description && (
                          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveEvent(event.id)}
                          disabled={actionLoading === event.id}
                          className={`flex-1 font-medium py-2 rounded-lg text-sm transition flex items-center justify-center space-x-2 ${
                            isDarkMode 
                              ? 'bg-green-950/50 hover:bg-green-900/70 text-green-300' 
                              : 'bg-green-50 hover:bg-green-100 text-green-700'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === event.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectEvent(event.id)}
                          disabled={actionLoading === event.id}
                          className={`flex-1 font-medium py-2 rounded-lg text-sm transition flex items-center justify-center space-x-2 ${
                            isDarkMode 
                              ? 'bg-red-950/50 hover:bg-red-900/70 text-red-300' 
                              : 'bg-red-50 hover:bg-red-100 text-red-700'
                          } disabled:opacity-50`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${
                    isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                  } backdrop-blur-lg rounded-lg shadow-xl border p-6 text-center`}>
                    <Calendar className={`w-12 h-12 mx-auto mb-3 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No pending events
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminApprovalsPage
