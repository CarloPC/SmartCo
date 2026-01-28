import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Users, TrendingUp, Package, Loader2 } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import foodAidService from '../services/foodAidService'

const FoodAidPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  
  const [foodAidSchedule, setFoodAidSchedule] = useState([])
  const [stats, setStats] = useState({
    totalFamilies: 0,
    deliveredFamilies: 0,
    progress: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFoodAidData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch schedules and stats in parallel
        const [schedules, foodStats] = await Promise.all([
          foodAidService.getFoodAidSchedules(),
          foodAidService.getFoodAidStats()
        ])
        
        // Format schedules
        const formattedSchedules = schedules
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 10) // Limit to 10 recent schedules
          .map(schedule => ({
            ...schedule,
            status: formatStatus(schedule.status)
          }))
        
        setFoodAidSchedule(formattedSchedules)
        setStats({
          totalFamilies: foodStats.totalFamilies,
          deliveredFamilies: foodStats.deliveredFamilies,
          progress: foodStats.progress
        })
      } catch (error) {
        console.error('Error fetching food aid data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFoodAidData()
  }, [])

  const formatStatus = (status) => {
    if (status === 'in-progress') return 'In Progress'
    if (status === 'scheduled') return 'Scheduled'
    if (status === 'completed') return 'Completed'
    return status
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
            ? 'bg-gradient-to-r from-green-900/90 to-emerald-950/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-green-500/90 to-green-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3 mb-2">
            <Package className="w-6 h-6" />
            <h2 className="text-xl font-bold">Food Aid Distribution</h2>
          </div>
          <p className={isDarkMode ? 'text-green-200' : 'text-green-100'}>AI-optimized scheduling per purok</p>
        </div>

        {isLoading ? (
          <div className={`${
            isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
          } backdrop-blur-lg rounded-lg p-8 border text-center shadow-lg`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${
              isDarkMode ? 'text-green-400' : 'text-green-500'
            }`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading food aid data...
            </p>
          </div>
        ) : (
          <>
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Distribution Progress</span>
                <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.progress}%</span>
              </div>
              <div className={`w-full rounded-full h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className={`${
                  isDarkMode ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-green-500 to-green-600'
                } h-3 rounded-full transition-all`} style={{width: `${stats.progress}%`}}></div>
              </div>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {stats.deliveredFamilies} of {stats.totalFamilies} families served
              </p>
            </div>

            {foodAidSchedule.length > 0 ? (
              <div className="space-y-3">
                {foodAidSchedule.map(schedule => (
                  <div key={schedule.id} className={`${
                    isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                  } backdrop-blur-lg rounded-lg shadow-xl border p-4`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{schedule.purok}</h4>
                        <div className={`flex items-center space-x-4 mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{schedule.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{schedule.totalFamilies || schedule.families} families</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        schedule.status === 'In Progress' 
                          ? isDarkMode ? 'bg-yellow-950/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700' 
                          : schedule.status === 'Completed'
                            ? isDarkMode ? 'bg-green-950/50 text-green-400' : 'bg-green-100 text-green-700'
                            : isDarkMode ? 'bg-blue-950/50 text-blue-400' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {schedule.status}
                      </span>
                    </div>
                    <button className={`w-full ${
                      isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    } font-medium py-2 rounded-lg text-sm transition`}>
                      View Distribution Route
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${
                isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
              } backdrop-blur-lg rounded-lg shadow-xl border p-6 text-center`}>
                <Package className={`w-12 h-12 mx-auto mb-3 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No food aid schedules found
                </p>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => navigate('/food-aid/optimize')}
          className={`w-full ${
            isDarkMode 
              ? 'bg-green-900/90 hover:bg-green-800 border-gray-700/50' 
              : 'bg-green-500/90 hover:bg-green-600 border-white/20'
          } backdrop-blur-sm text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-xl border`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Optimize New Schedule</span>
        </button>
      </div>
    </div>
  )
}

export default FoodAidPage
