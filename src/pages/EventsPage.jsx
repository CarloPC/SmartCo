import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Plus } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'

const upcomingEvents = [
  { id: 1, title: 'Basketball Tournament', date: '2026-01-18', location: 'Barangay Court', participants: 32 },
  { id: 2, title: 'Health Check-up Drive', date: '2026-01-20', location: 'Barangay Hall', participants: 45 },
  { id: 3, title: 'Community Clean-up', date: '2026-01-25', location: 'All Puroks', participants: 78 }
]

const EventsPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()

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
            ? 'bg-gradient-to-r from-purple-900/90 to-violet-950/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-purple-500/90 to-purple-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-6 h-6" />
            <h2 className="text-xl font-bold">Community Events</h2>
          </div>
          <p className={isDarkMode ? 'text-purple-200' : 'text-purple-100'}>Manage sports and community activities</p>
        </div>

        <div className="space-y-3">
          {upcomingEvents.map(event => (
            <div key={event.id} className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg shadow-xl border p-4 hover:shadow-2xl transition`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{event.title}</h4>
                  <div className="space-y-1">
                    <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Users className="w-4 h-4" />
                      <span>{event.participants} participants</span>
                    </div>
                  </div>
                </div>
                <button className={`font-medium text-sm ${
                  isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                }`}>Manage</button>
              </div>
              <div className="flex space-x-2">
                <button className={`flex-1 font-medium py-2 rounded-lg text-sm transition ${
                  isDarkMode 
                    ? 'bg-purple-950/50 hover:bg-purple-900/70 text-purple-300' 
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                }`}>
                  View Details
                </button>
                <button className={`flex-1 font-medium py-2 rounded-lg text-sm transition ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}>
                  Notify
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => navigate('/events/create')}
          className={`w-full ${
            isDarkMode 
              ? 'bg-purple-900/90 hover:bg-purple-800 border-gray-700/50' 
              : 'bg-purple-500/90 hover:bg-purple-600 border-white/20'
          } backdrop-blur-sm text-white font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-xl border`}
        >
          <Plus className="w-5 h-5" />
          <span>Create New Event</span>
        </button>
      </div>
    </div>
  )
}

export default EventsPage
