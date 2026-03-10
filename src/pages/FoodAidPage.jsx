import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Users, TrendingUp, Package, Loader2, CheckCircle, XCircle } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import foodAidService from '../services/foodAidService'

const FoodAidPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const [foodAidSchedule, setFoodAidSchedule] = useState([])
  const [stats, setStats] = useState({ totalFamilies: 0, deliveredFamilies: 0, progress: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFoodAidData = async () => {
      try {
        setIsLoading(true)
        const [schedules, foodStats] = await Promise.all([
          foodAidService.getFoodAidSchedules(),
          foodAidService.getFoodAidStats()
        ])
        const formatStatus = (s) => ({ 'in-progress': 'In Progress', scheduled: 'Scheduled', completed: 'Completed' }[s] || s)
        setFoodAidSchedule(
          schedules.sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 10)
            .map(s => ({ ...s, status: formatStatus(s.status) }))
        )
        setStats({ totalFamilies: foodStats.totalFamilies, deliveredFamilies: foodStats.deliveredFamilies, progress: foodStats.progress })
      } catch (error) {
        console.error('Error fetching food aid data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFoodAidData()
  }, [])

  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95' : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-screen-xl">
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-green-900/90 to-emerald-950/90 border-gray-700/50' : 'bg-gradient-to-r from-green-500/90 to-green-600/90 border-white/20'} backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">Food Aid Distribution</h2>
              <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-100'}`}>AI-optimized scheduling per purok</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={`${card} p-10 text-center`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading food aid data...</p>
          </div>
        ) : (
          <>
            {/* Progress Card */}
            <div className={`${card} p-5 lg:p-6`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Distribution Progress</span>
                <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.progress}%</span>
              </div>
              <div className={`w-full rounded-full h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-3 rounded-full transition-all ${isDarkMode ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-green-500 to-green-600'}`}
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stats.deliveredFamilies} of {stats.totalFamilies} families served
                </p>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {stats.totalFamilies - stats.deliveredFamilies} remaining
                </p>
              </div>
            </div>

            {/* Schedule Grid */}
            {foodAidSchedule.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {foodAidSchedule.map(schedule => (
                  <div key={schedule.id} className={`${card} p-5`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{schedule.purok}</h4>
                          {schedule.approvalStatus === 'pending' && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isDarkMode ? 'bg-orange-950/50 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                              <Clock className="w-3 h-3" /><span>Pending</span>
                            </span>
                          )}
                          {schedule.approvalStatus === 'approved' && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isDarkMode ? 'bg-green-950/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                              <CheckCircle className="w-3 h-3" /><span>Approved</span>
                            </span>
                          )}
                          {schedule.approvalStatus === 'rejected' && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isDarkMode ? 'bg-red-950/50 text-red-400' : 'bg-red-100 text-red-700'}`}>
                              <XCircle className="w-3 h-3" /><span>Rejected</span>
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{schedule.date}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Users className="w-4 h-4" />
                            <span>{schedule.totalFamilies || schedule.families} families</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${
                        schedule.status === 'In Progress'
                          ? isDarkMode ? 'bg-yellow-950/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                          : schedule.status === 'Completed'
                            ? isDarkMode ? 'bg-green-950/50 text-green-400' : 'bg-green-100 text-green-700'
                            : isDarkMode ? 'bg-blue-950/50 text-blue-400' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {schedule.status}
                      </span>
                    </div>
                    <button className={`w-full font-medium py-2.5 rounded-xl text-sm transition ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}>
                      View Distribution Route
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${card} p-10 text-center`}>
                <Package className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No food aid schedules found</p>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => navigate('/food-aid/optimize')}
          className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-semibold transition shadow-xl border ${isDarkMode ? 'bg-green-900/90 hover:bg-green-800 border-gray-700/50 text-white' : 'bg-green-500/90 hover:bg-green-600 border-white/20 text-white'}`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Optimize New Schedule</span>
        </button>
      </div>
    </div>
  )
}

export default FoodAidPage
