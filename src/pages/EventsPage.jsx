import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Plus, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import eventsService from '../services/eventsService'

const EventsPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const allEvents = await eventsService.getEvents()
        const now = new Date()
        const upcoming = allEvents
          .filter(e => new Date(e.date) >= now)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(e => ({ ...e, location: e.venue, participants: e.attendees?.length || e.expectedAttendees || 0 }))
        setUpcomingEvents(upcoming)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const card = `${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'} backdrop-blur-lg rounded-2xl shadow-xl border`

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95' : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85'}`} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-screen-xl">
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-purple-900/90 to-violet-950/90 border-gray-700/50' : 'bg-gradient-to-r from-purple-500/90 to-purple-600/90 border-white/20'} backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">Community Events</h2>
              <p className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-100'}`}>Manage sports and community activities</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={`${card} p-10 text-center`}>
            <Loader2 className={`w-8 h-8 animate-spin mx-auto ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading events...</p>
          </div>
        ) : upcomingEvents.length > 0 ? (
          /* Events grid - 1 col mobile, 2 col lg */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingEvents.map(event => (
              <div key={event.id} className={`${card} p-5 hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className={`font-semibold text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{event.title}</h4>
                      {event.approvalStatus === 'pending' && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isDarkMode ? 'bg-orange-950/50 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                          <Clock className="w-3 h-3" /><span>Pending</span>
                        </span>
                      )}
                      {event.approvalStatus === 'approved' && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isDarkMode ? 'bg-green-950/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                          <CheckCircle className="w-3 h-3" /><span>Approved</span>
                        </span>
                      )}
                      {event.approvalStatus === 'rejected' && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${isDarkMode ? 'bg-red-950/50 text-red-400' : 'bg-red-100 text-red-700'}`}>
                          <XCircle className="w-3 h-3" /><span>Rejected</span>
                        </span>
                      )}
                    </div>
                    <div className={`space-y-1.5 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{event.participants} participants</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button className={`flex-1 font-medium py-2.5 rounded-xl text-sm transition ${isDarkMode ? 'bg-purple-950/50 hover:bg-purple-900/70 text-purple-300' : 'bg-purple-50 hover:bg-purple-100 text-purple-700'}`}>
                    View Details
                  </button>
                  <button className={`flex-1 font-medium py-2.5 rounded-xl text-sm transition ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}>
                    Notify
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${card} p-10 text-center`}>
            <Calendar className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No upcoming events</p>
          </div>
        )}

        <button
          onClick={() => navigate('/events/create')}
          className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl font-semibold transition shadow-xl border ${isDarkMode ? 'bg-purple-900/90 hover:bg-purple-800 border-gray-700/50 text-white' : 'bg-purple-500/90 hover:bg-purple-600 border-white/20 text-white'}`}
        >
          <Plus className="w-5 h-5" />
          <span>Create New Event</span>
        </button>
      </div>
    </div>
  )
}

export default EventsPage
