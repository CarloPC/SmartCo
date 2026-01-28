import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Calendar, Clock, MapPin, Users, FileText, Tag, TrendingUp, ArrowLeft, Loader2, AlertCircle, CloudSun } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import eventsService from '../services/eventsService'

const EVENT_CATEGORIES = ['Sports', 'Health', 'Community Service', 'Social', 'Educational']
const DURATION_OPTIONS = ['30 minutes', '1 hour', '2 hours', '3 hours', '4 hours', 'Half day', 'Full day']

const CreateEventPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    duration: '',
    venue: '',
    expectedAttendees: '',
    description: ''
  })
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiRecommendation, setAiRecommendation] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAnalyze = async () => {
    if (!formData.title || !formData.category || !formData.date || !formData.time || !formData.venue) {
      alert('Please fill in all required fields')
      return
    }

    setIsAnalyzing(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // Generate AI recommendations
    const dayOfWeek = new Date(formData.date).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const conflicts = []
    
    // Check for potential conflicts based on category and day
    if (isWeekend && formData.category === 'Health') {
      conflicts.push({
        type: 'minor',
        message: 'Health events on weekends typically have 20% lower attendance'
      })
    } else if (!isWeekend && formData.category === 'Sports') {
      conflicts.push({
        type: 'minor',
        message: 'Weekday sports events may conflict with work schedules'
      })
    }
    
    const schedulingScore = Math.floor(75 + Math.random() * 20)
    const predictedAttendance = formData.expectedAttendees 
      ? Math.floor(parseInt(formData.expectedAttendees) * (0.80 + Math.random() * 0.30))
      : 0
    
    const alternativeTimes = [
      { time: '09:00 AM', score: 92, label: 'Best for community participation' },
      { time: '02:00 PM', score: 88, label: 'Good for post-lunch activities' },
      { time: '04:00 PM', score: 85, label: 'Suitable for after-work attendance' }
    ]
    
    setAiRecommendation({
      recommendedDate: formData.date,
      recommendedTime: formData.time,
      alternativeTimes,
      conflicts,
      weatherForecast: 'Clear skies, 28°C - Perfect outdoor conditions',
      predictedAttendance,
      schedulingScore,
      reasoning: isWeekend 
        ? 'Weekend timing shows historically high community participation rates'
        : 'Weekday scheduling optimized for maximum accessibility'
    })
    
    setIsAnalyzing(false)
  }

  const handleCreateEvent = async () => {
    try {
      // Save the event with AI recommendations
      const eventData = {
        ...formData,
        expectedAttendees: parseInt(formData.expectedAttendees) || 0,
        aiRecommendation,
        createdBy: user?.fullName,
        createdById: user?.id
      }

      await eventsService.createEvent(eventData)
      
      alert('Event created successfully!')
      navigate('/events')
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
    }
  }

  const formatTime = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${period}`
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

      <div className="p-4 space-y-4 pb-24">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className={`flex items-center space-x-2 ${
            isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-100 hover:text-white'
          } transition`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Events</span>
        </button>

        {/* Header */}
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-purple-900/90 to-violet-950/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-purple-500/90 to-purple-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">Create New Event</h2>
          </div>
          <p className={isDarkMode ? 'text-purple-200' : 'text-purple-100'}>
            AI-Optimized Event Scheduling
          </p>
        </div>

        {/* Form Section */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-lg p-4 border shadow-lg space-y-4`}>
          
          {/* Event Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Basketball Tournament 2026"
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>

          {/* Event Category */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Event Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="">Select category...</option>
                {EVENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Event Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-200' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Event Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-200' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Duration
            </label>
            <div className="relative">
              <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <select
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="">Select duration...</option>
                {DURATION_OPTIONS.map(dur => (
                  <option key={dur} value={dur}>{dur}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Venue/Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                placeholder="e.g., Barangay Court"
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>
          </div>

          {/* Expected Attendees */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Expected Attendees
            </label>
            <div className="relative">
              <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="number"
                name="expectedAttendees"
                value={formData.expectedAttendees}
                onChange={handleInputChange}
                placeholder="e.g., 50"
                min="1"
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Event Description
            </label>
            <div className="relative">
              <FileText className={`absolute left-3 top-3 w-4 h-4 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide details about the event..."
                rows="3"
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none`}
              />
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full ${
              isDarkMode 
                ? 'bg-purple-900/90 hover:bg-purple-800 border-gray-700/50' 
                : 'bg-purple-500/90 hover:bg-purple-600 border-white/20'
            } backdrop-blur-sm text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 transition shadow-xl border disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                <span>Optimize Schedule</span>
              </>
            )}
          </button>
        </div>

        {/* AI Recommendations */}
        {aiRecommendation && (
          <div className="space-y-4">
            {/* Recommendation Header */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className={`w-5 h-5 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <h3 className={`font-bold text-lg ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  AI Scheduling Recommendations
                </h3>
              </div>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {aiRecommendation.reasoning}
              </p>
            </div>

            {/* Scheduling Score */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Scheduling Score
                </span>
                <span className={`text-lg font-bold ${
                  aiRecommendation.schedulingScore >= 85 
                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                    : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`}>
                  {aiRecommendation.schedulingScore}%
                </span>
              </div>
              <div className={`w-full rounded-full h-3 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className={`${
                    aiRecommendation.schedulingScore >= 85
                      ? 'bg-gradient-to-r from-green-600 to-green-700'
                      : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  } h-3 rounded-full transition-all`}
                  style={{ width: `${aiRecommendation.schedulingScore}%` }}
                ></div>
              </div>
            </div>

            {/* Weather & Attendance */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`${
                isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
              } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
                <div className="flex items-center space-x-2 mb-2">
                  <CloudSun className={`w-4 h-4 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Weather Forecast
                  </span>
                </div>
                <p className={`text-sm font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {aiRecommendation.weatherForecast}
                </p>
              </div>
              <div className={`${
                isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
              } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className={`w-4 h-4 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Predicted Attendance
                  </span>
                </div>
                <p className={`text-sm font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {aiRecommendation.predictedAttendance} participants
                </p>
              </div>
            </div>

            {/* Conflicts */}
            {aiRecommendation.conflicts.length > 0 ? (
              <div className={`${
                isDarkMode ? 'bg-yellow-950/30 border-yellow-700/50' : 'bg-yellow-50/90 border-yellow-300'
              } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
                <div className="flex items-start space-x-2">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                  <div className="flex-1">
                    <h4 className={`font-semibold text-sm mb-2 ${
                      isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                    }`}>
                      Scheduling Considerations
                    </h4>
                    {aiRecommendation.conflicts.map((conflict, idx) => (
                      <p key={idx} className={`text-sm ${
                        isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
                      }`}>
                        • {conflict.message}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${
                isDarkMode ? 'bg-green-950/30 border-green-700/50' : 'bg-green-50/90 border-green-300'
              } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
                <div className="flex items-center space-x-2">
                  <TrendingUp className={`w-5 h-5 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <span className={`font-semibold text-sm ${
                    isDarkMode ? 'text-green-300' : 'text-green-800'
                  }`}>
                    No conflicts detected - Optimal scheduling!
                  </span>
                </div>
              </div>
            )}

            {/* Recommended Time */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h4 className={`font-semibold mb-3 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Recommended Time Slot
              </h4>
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-purple-950/50' : 'bg-purple-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className={`w-5 h-5 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                    <span className={`font-bold ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                      {formatTime(aiRecommendation.recommendedTime)}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    Best Option
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/events')}
                className={`${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300' 
                    : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                } backdrop-blur-sm font-semibold py-3 rounded-xl transition shadow-xl border`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                className={`${
                  isDarkMode 
                    ? 'bg-purple-900/90 hover:bg-purple-800 border-gray-700/50' 
                    : 'bg-purple-500/90 hover:bg-purple-600 border-white/20'
                } backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition shadow-xl border`}
              >
                Create Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateEventPage
