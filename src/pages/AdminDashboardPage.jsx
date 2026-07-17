import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Activity, Package, Calendar, AlertCircle, Clock, Loader2 } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import adminService from '../services/adminService'
import foodAidService from '../services/foodAidService'

const StatGroup = ({ icon: Icon, title, total, pending, approved, totalLabel, pendingLabel, approvedLabel, isDarkMode, onManage, manageLabel }) => {
  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`
  return (
    <div className={`${card} p-5 lg:p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          <Icon className="w-5 h-5" />
          <span>{title}</span>
        </h3>
        {onManage && (
          <button onClick={onManage} className={`text-sm font-medium ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
            {manageLabel || 'Manage'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: total, label: totalLabel || 'Total', color: isDarkMode ? 'text-gray-100' : 'text-gray-800' },
          { value: pending, label: pendingLabel || 'Pending', color: 'text-orange-500' },
          { value: approved, label: approvedLabel || 'Approved', color: 'text-green-500' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className={`text-2xl lg:text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const AdminDashboardPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0, totalResidents: 0, totalOfficials: 0,
    totalHealthRecords: 0, pendingHealthRecords: 0, approvedHealthRecords: 0,
    totalFoodAid: 0, pendingFoodAid: 0, approvedFoodAid: 0,
    totalEvents: 0, pendingEvents: 0, approvedEvents: 0, totalPending: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [foodAidAnalytics, setFoodAidAnalytics] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const [adminStats, faAnalytics] = await Promise.all([
          adminService.getAdminStats(),
          foodAidService.getDashboardAnalytics(),
        ])
        setStats(adminStats)
        setFoodAidAnalytics(faAnalytics)
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95' : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-screen-xl">
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-indigo-900/90 to-purple-950/90 border-gray-700/50' : 'bg-gradient-to-r from-indigo-500/90 to-purple-600/90 border-white/20'} backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">Admin Dashboard</h2>
              <p className={`text-sm ${isDarkMode ? 'text-indigo-200' : 'text-indigo-100'}`}>Overview and management control panel</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={`${card} p-10 text-center`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Pending Alert Banner */}
            {stats.totalPending > 0 && (
              <div
                className={`${isDarkMode ? 'bg-orange-950/50 border-orange-800/50' : 'bg-orange-100/90 border-orange-300'} backdrop-blur-lg rounded-2xl p-4 border shadow-lg cursor-pointer hover:shadow-xl transition`}
                onClick={() => navigate('/admin/approvals')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                        {stats.totalPending} Pending Approval{stats.totalPending > 1 ? 's' : ''} — Click to review
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>Requires your attention</p>
                    </div>
                  </div>
                  <Clock className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
              </div>
            )}

            {/* Stat Groups Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Users */}
              <div className={`${card} p-5 lg:p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    <Users className="w-5 h-5" /><span>Users</span>
                  </h3>
                  <button onClick={() => navigate('/admin/users')} className={`text-sm font-medium ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>Manage</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: stats.totalUsers, label: 'Total', color: isDarkMode ? 'text-gray-100' : 'text-gray-800' },
                    { value: stats.totalResidents, label: 'Residents', color: 'text-blue-500' },
                    { value: stats.totalOfficials, label: 'Officials', color: 'text-purple-500' },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <div className={`text-2xl lg:text-3xl font-bold ${s.color}`}>{s.value}</div>
                      <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Records */}
              <StatGroup icon={Activity} title="Health Records"
                total={stats.totalHealthRecords} pending={stats.pendingHealthRecords} approved={stats.approvedHealthRecords}
                isDarkMode={isDarkMode}
              />

              {/* Food Aid */}
              <StatGroup icon={Package} title="Food Aid Distribution"
                total={stats.totalFoodAid} pending={stats.pendingFoodAid} approved={stats.approvedFoodAid}
                isDarkMode={isDarkMode}
              />

              {/* Events */}
              <StatGroup icon={Calendar} title="Events"
                total={stats.totalEvents} pending={stats.pendingEvents} approved={stats.approvedEvents}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Food Aid Distribution Analytics */}
            {foodAidAnalytics && (
              <div className={`${card} p-5 lg:p-6`}>
                <h3 className={`font-semibold flex items-center space-x-2 mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  <Package className="w-5 h-5" /><span>Food Aid Distribution Analytics</span>
                </h3>

                {/* Workflow stage counts */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
                  {[
                    { label: 'Pending',    value: foodAidAnalytics.pending,    color: 'text-orange-500' },
                    { label: 'Approved',   value: foodAidAnalytics.approved,   color: 'text-blue-500' },
                    { label: 'Scheduled',  value: foodAidAnalytics.scheduled,  color: 'text-purple-500' },
                    { label: 'In Progress',value: foodAidAnalytics.inProgress, color: 'text-yellow-500' },
                    { label: 'Completed',  value: foodAidAnalytics.completed,  color: 'text-green-500' },
                    { label: 'Cancelled',  value: foodAidAnalytics.cancelled,  color: 'text-red-500' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className={`text-xl lg:text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Households */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Total Households',     value: foodAidAnalytics.totalHouseholds },
                    { label: 'Households Served',     value: foodAidAnalytics.householdsServed, color: 'text-green-500' },
                    { label: 'Households Remaining',  value: foodAidAnalytics.householdsRemaining, color: 'text-orange-500' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-3 text-center ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                      <div className={`text-xl font-bold ${s.color || (isDarkMode ? 'text-gray-100' : 'text-gray-800')}`}>{s.value}</div>
                      <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress by purok */}
                <div className="mb-5">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Progress by Purok</p>
                  <div className="space-y-2">
                    {foodAidAnalytics.progressByPurok.map(p => (
                      <div key={p.purok}>
                        <div className={`flex justify-between text-xs mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span>{p.purok} <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>({p.distributions} distribution{p.distributions === 1 ? '' : 's'})</span></span>
                          <span className="font-semibold">{p.householdsServed}/{p.householdsTarget} · {p.percentage}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${p.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Volunteer performance */}
                {foodAidAnalytics.volunteerPerformance.length > 0 && (
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Volunteer Performance</p>
                    <div className="space-y-1.5">
                      {foodAidAnalytics.volunteerPerformance.map(v => (
                        <div key={v.id} className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-800/60 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                          <span className="font-medium">{v.name}</span>
                          <span>{v.completed}/{v.assigned} completed · {v.householdsServed} households served</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/admin/approvals')}
                className={`${isDarkMode ? 'bg-orange-900/90 hover:bg-orange-800 border-gray-700/50' : 'bg-orange-500/90 hover:bg-orange-600 border-white/20'} backdrop-blur-sm text-white font-semibold py-5 rounded-2xl flex items-center justify-center space-x-3 transition shadow-xl border`}
              >
                <Clock className="w-6 h-6" />
                <span className="text-base">View Approvals</span>
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className={`${isDarkMode ? 'bg-indigo-900/90 hover:bg-indigo-800 border-gray-700/50' : 'bg-indigo-500/90 hover:bg-indigo-600 border-white/20'} backdrop-blur-sm text-white font-semibold py-5 rounded-2xl flex items-center justify-center space-x-3 transition shadow-xl border`}
              >
                <Users className="w-6 h-6" />
                <span className="text-base">Manage Users</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage
