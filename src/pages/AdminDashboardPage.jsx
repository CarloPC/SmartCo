import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Activity, Package, Calendar, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import adminService from '../services/adminService'

const AdminDashboardPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResidents: 0,
    totalOfficials: 0,
    totalHealthRecords: 0,
    pendingHealthRecords: 0,
    approvedHealthRecords: 0,
    totalFoodAid: 0,
    pendingFoodAid: 0,
    approvedFoodAid: 0,
    totalEvents: 0,
    pendingEvents: 0,
    approvedEvents: 0,
    totalPending: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const adminStats = await adminService.getAdminStats()
      setStats(adminStats)
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setIsLoading(false)
    }
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
            ? 'bg-gradient-to-r from-indigo-900/90 to-purple-950/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-indigo-500/90 to-purple-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3 mb-2">
            <LayoutDashboard className="w-6 h-6" />
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
          </div>
          <p className={isDarkMode ? 'text-indigo-200' : 'text-indigo-100'}>
            Overview and management control panel
          </p>
        </div>

        {isLoading ? (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-lg p-8 border text-center shadow-lg`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${
              isDarkMode ? 'text-indigo-400' : 'text-indigo-500'
            }`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* Pending Approvals Alert */}
            {stats.totalPending > 0 && (
              <div className={`${
                isDarkMode ? 'bg-orange-950/50 border-orange-800/50' : 'bg-orange-100/90 border-orange-300'
              } backdrop-blur-lg rounded-lg p-4 border shadow-lg cursor-pointer hover:shadow-xl transition`}
                onClick={() => navigate('/admin/approvals')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                        {stats.totalPending} Pending Approval{stats.totalPending > 1 ? 's' : ''}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                        Tap to review and approve
                      </p>
                    </div>
                  </div>
                  <Clock className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                </div>
              </div>
            )}

            {/* Users Stats */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  <Users className="w-5 h-5" />
                  <span>Users</span>
                </h3>
                <button
                  onClick={() => navigate('/admin/users')}
                  className={`text-sm font-medium ${
                    isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                >
                  Manage
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {stats.totalUsers}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.totalResidents}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Residents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{stats.totalOfficials}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Officials</div>
                </div>
              </div>
            </div>

            {/* Health Records Stats */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h3 className={`font-semibold flex items-center space-x-2 mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                <Activity className="w-5 h-5" />
                <span>Health Records</span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {stats.totalHealthRecords}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{stats.pendingHealthRecords}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.approvedHealthRecords}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</div>
                </div>
              </div>
            </div>

            {/* Food Aid Stats */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h3 className={`font-semibold flex items-center space-x-2 mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                <Package className="w-5 h-5" />
                <span>Food Aid Distribution</span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {stats.totalFoodAid}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{stats.pendingFoodAid}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.approvedFoodAid}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</div>
                </div>
              </div>
            </div>

            {/* Events Stats */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h3 className={`font-semibold flex items-center space-x-2 mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                <Calendar className="w-5 h-5" />
                <span>Events</span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {stats.totalEvents}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{stats.pendingEvents}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.approvedEvents}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/admin/approvals')}
                className={`${
                  isDarkMode 
                    ? 'bg-orange-900/90 hover:bg-orange-800 border-gray-700/50' 
                    : 'bg-orange-500/90 hover:bg-orange-600 border-white/20'
                } backdrop-blur-sm text-white font-semibold py-4 rounded-xl flex flex-col items-center justify-center space-y-2 transition shadow-xl border`}
              >
                <Clock className="w-6 h-6" />
                <span>View Approvals</span>
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className={`${
                  isDarkMode 
                    ? 'bg-indigo-900/90 hover:bg-indigo-800 border-gray-700/50' 
                    : 'bg-indigo-500/90 hover:bg-indigo-600 border-white/20'
                } backdrop-blur-sm text-white font-semibold py-4 rounded-xl flex flex-col items-center justify-center space-y-2 transition shadow-xl border`}
              >
                <Users className="w-6 h-6" />
                <span>Manage Users</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage
