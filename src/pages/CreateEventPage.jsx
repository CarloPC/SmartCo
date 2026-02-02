import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Calendar, Clock, MapPin, Users, FileText, Tag, TrendingUp, ArrowLeft, Loader2, AlertCircle, CloudSun, Sun, CloudRain, Cloud, Wind, AlertTriangle, CheckCircle, Activity, Target, Zap, Star } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import eventsService from '../services/eventsService'

const EVENT_CATEGORIES = ['Sports', 'Health', 'Community Service', 'Social', 'Educational']
const DURATION_OPTIONS = ['30 minutes', '1 hour', '2 hours', '3 hours', '4 hours', 'Half day', 'Full day']

// Venue characteristics for AI analysis
const VENUE_DATA = {
  'Barangay Court': { capacity: 200, type: 'outdoor', facilities: ['sports', 'seating', 'lighting'], covered: false },
  'Barangay Hall': { capacity: 150, type: 'indoor', facilities: ['chairs', 'stage', 'sound_system', 'AC'], covered: true },
  'Community Center': { capacity: 100, type: 'indoor', facilities: ['tables', 'chairs', 'kitchen'], covered: true },
  'Barangay Plaza': { capacity: 300, type: 'outdoor', facilities: ['stage', 'seating'], covered: false },
  'Multi-Purpose Hall': { capacity: 250, type: 'indoor', facilities: ['stage', 'sound_system', 'chairs', 'AC'], covered: true }
}

// Category-specific requirements
const CATEGORY_REQUIREMENTS = {
  'Sports': { idealVenue: 'outdoor', facilities: ['sports'], timePreference: 'morning', attendanceMultiplier: 1.2 },
  'Health': { idealVenue: 'indoor', facilities: ['chairs', 'AC'], timePreference: 'morning', attendanceMultiplier: 1.0 },
  'Community Service': { idealVenue: 'any', facilities: [], timePreference: 'morning', attendanceMultiplier: 0.9 },
  'Social': { idealVenue: 'any', facilities: ['sound_system'], timePreference: 'afternoon', attendanceMultiplier: 1.1 },
  'Educational': { idealVenue: 'indoor', facilities: ['chairs', 'AC'], timePreference: 'afternoon', attendanceMultiplier: 0.85 }
}

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

  // Advanced AI: Weather prediction
  const predictWeather = (date) => {
    const weatherTypes = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'stormy']
    const dayOfWeek = new Date(date).getDay()
    const month = new Date(date).getMonth()
    
    // Simulate seasonal patterns (Philippines)
    let weatherIndex
    if (month >= 5 && month <= 10) { // Rainy season
      weatherIndex = Math.floor(Math.random() * 5)
    } else { // Dry season
      weatherIndex = Math.floor(Math.random() * 3)
    }
    
    const weather = weatherTypes[weatherIndex]
    const temperature = weather === 'sunny' ? 32 : weather === 'rainy' ? 24 : weather === 'stormy' ? 22 : 28
    const humidity = weather === 'rainy' || weather === 'stormy' ? 85 : weather === 'sunny' ? 60 : 70
    const windSpeed = weather === 'stormy' ? 35 : weather === 'rainy' ? 20 : weather === 'sunny' ? 10 : 15
    const rainfall = weather === 'stormy' ? 15 : weather === 'rainy' ? 8 : 0
    
    return { weather, temperature, humidity, windSpeed, rainfall }
  }

  // Advanced AI: Venue suitability analysis
  const analyzeVenueSuitability = (venue, category, weather, expectedAttendees) => {
    const venueInfo = VENUE_DATA[venue] || { capacity: 100, type: 'outdoor', facilities: [], covered: false }
    const categoryReq = CATEGORY_REQUIREMENTS[category]
    
    let suitabilityScore = 100
    const issues = []
    const benefits = []
    
    // Capacity check
    if (expectedAttendees > venueInfo.capacity) {
      suitabilityScore -= 30
      issues.push({
        severity: 'high',
        message: `Venue capacity (${venueInfo.capacity}) may be insufficient for ${expectedAttendees} attendees`,
        impact: 'Overcrowding, safety concerns'
      })
    } else if (expectedAttendees > venueInfo.capacity * 0.8) {
      suitabilityScore -= 15
      issues.push({
        severity: 'medium',
        message: `Near capacity - Limited space for ${expectedAttendees} attendees`,
        impact: 'Tight seating, limited mobility'
      })
    } else {
      benefits.push('Adequate space for comfortable attendance')
    }
    
    // Weather compatibility
    if (!venueInfo.covered && (weather.weather === 'rainy' || weather.weather === 'stormy')) {
      suitabilityScore -= 40
      issues.push({
        severity: 'high',
        message: 'Outdoor venue with rain forecast',
        impact: 'Event cancellation risk, equipment damage'
      })
    } else if (!venueInfo.covered && weather.temperature > 32) {
      suitabilityScore -= 10
      issues.push({
        severity: 'low',
        message: 'High temperature in outdoor venue',
        impact: 'Heat discomfort for attendees'
      })
    } else if (venueInfo.covered) {
      benefits.push('Indoor venue provides weather protection')
    }
    
    // Facilities match
    const hasRequiredFacilities = categoryReq.facilities.every(f => venueInfo.facilities.includes(f))
    if (!hasRequiredFacilities) {
      suitabilityScore -= 15
      issues.push({
        severity: 'medium',
        message: `Missing facilities for ${category} event`,
        impact: 'Limited functionality, may need additional equipment'
      })
    } else {
      benefits.push('All required facilities available')
    }
    
    // Venue type match
    if (categoryReq.idealVenue !== 'any' && categoryReq.idealVenue !== venueInfo.type) {
      suitabilityScore -= 10
      issues.push({
        severity: 'low',
        message: `${venueInfo.type} venue not ideal for ${category}`,
        impact: 'Suboptimal experience'
      })
    }
    
    const status = suitabilityScore >= 80 ? 'excellent' : suitabilityScore >= 60 ? 'good' : suitabilityScore >= 40 ? 'acceptable' : 'poor'
    
    return {
      score: Math.max(0, Math.floor(suitabilityScore)),
      status,
      capacity: venueInfo.capacity,
      type: venueInfo.type,
      covered: venueInfo.covered,
      facilities: venueInfo.facilities,
      issues,
      benefits
    }
  }

  // Advanced AI: Attendance prediction
  const predictAttendance = (category, date, time, weather, expectedAttendees) => {
    if (!expectedAttendees) return { predicted: 0, range: [0, 0], confidence: 0, factors: [] }
    
    let multiplier = 1.0
    const factors = []
    
    const dayOfWeek = new Date(date).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const [hours] = time.split(':').map(Number)
    
    // Day of week factor
    if (isWeekend) {
      multiplier *= 1.25
      factors.push({ factor: 'Weekend', impact: '+25%', positive: true })
    } else {
      multiplier *= 0.85
      factors.push({ factor: 'Weekday', impact: '-15%', positive: false })
    }
    
    // Time of day factor
    if (hours >= 7 && hours <= 9) {
      multiplier *= 1.1
      factors.push({ factor: 'Morning (7-9AM)', impact: '+10%', positive: true })
    } else if (hours >= 14 && hours <= 16) {
      multiplier *= 1.05
      factors.push({ factor: 'Afternoon (2-4PM)', impact: '+5%', positive: true })
    } else if (hours >= 18 && hours <= 20) {
      multiplier *= 0.95
      factors.push({ factor: 'Evening (6-8PM)', impact: '-5%', positive: false })
    }
    
    // Weather factor
    if (weather.weather === 'sunny' || weather.weather === 'partly_cloudy') {
      multiplier *= 1.15
      factors.push({ factor: 'Good Weather', impact: '+15%', positive: true })
    } else if (weather.weather === 'rainy') {
      multiplier *= 0.65
      factors.push({ factor: 'Rainy Weather', impact: '-35%', positive: false })
    } else if (weather.weather === 'stormy') {
      multiplier *= 0.4
      factors.push({ factor: 'Storm Forecast', impact: '-60%', positive: false })
    }
    
    // Category factor
    const categoryMult = CATEGORY_REQUIREMENTS[category]?.attendanceMultiplier || 1.0
    multiplier *= categoryMult
    if (categoryMult > 1) {
      factors.push({ factor: `${category} Popularity`, impact: `+${Math.round((categoryMult - 1) * 100)}%`, positive: true })
    } else if (categoryMult < 1) {
      factors.push({ factor: `${category} Engagement`, impact: `${Math.round((categoryMult - 1) * 100)}%`, positive: false })
    }
    
    const predicted = Math.round(expectedAttendees * multiplier)
    const variance = Math.round(predicted * 0.15)
    const confidence = Math.min(95, Math.max(60, Math.round(85 - (Math.abs(multiplier - 1) * 30))))
    
    return {
      predicted,
      range: [Math.max(0, predicted - variance), predicted + variance],
      confidence,
      multiplier: multiplier.toFixed(2),
      factors
    }
  }

  // Advanced AI: Risk assessment
  const assessRisks = (category, date, time, venue, weather, venueAnalysis, expectedAttendees) => {
    const risks = []
    
    // Weather risks
    if (weather.weather === 'stormy') {
      risks.push({
        type: 'weather',
        severity: 'critical',
        message: 'Storm forecast - High cancellation risk',
        probability: 85,
        mitigation: 'Schedule backup date, have indoor alternative ready'
      })
    } else if (weather.weather === 'rainy' && !venueAnalysis.covered) {
      risks.push({
        type: 'weather',
        severity: 'high',
        message: 'Rain expected at outdoor venue',
        probability: 70,
        mitigation: 'Prepare tents/canopies, have rain contingency plan'
      })
    }
    
    // Venue capacity risks
    if (venueAnalysis.issues.some(i => i.severity === 'high' && i.message.includes('capacity'))) {
      risks.push({
        type: 'capacity',
        severity: 'high',
        message: 'Insufficient venue capacity',
        probability: 90,
        mitigation: 'Limit registrations, consider larger venue, or split into multiple sessions'
      })
    }
    
    // Timing risks
    const [hours] = time.split(':').map(Number)
    const dayOfWeek = new Date(date).getDay()
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hours >= 9 && hours <= 17) {
      risks.push({
        type: 'timing',
        severity: 'medium',
        message: 'Event during typical work hours',
        probability: 60,
        mitigation: 'Expect lower turnout, target retirees/students, or reschedule to evening'
      })
    }
    
    // Category-specific risks
    if (category === 'Sports' && weather.temperature > 33) {
      risks.push({
        type: 'health',
        severity: 'medium',
        message: 'High temperature for physical activities',
        probability: 75,
        mitigation: 'Provide hydration stations, schedule frequent breaks, have first aid ready'
      })
    }
    
    if (category === 'Social' && weather.weather === 'rainy') {
      risks.push({
        type: 'attendance',
        severity: 'medium',
        message: 'Rain may significantly reduce social event turnout',
        probability: 65,
        mitigation: 'Send weather updates, confirm attendance day before'
      })
    }
    
    // Low-risk scenarios
    if (risks.length === 0) {
      risks.push({
        type: 'none',
        severity: 'low',
        message: 'No significant risks identified',
        probability: 10,
        mitigation: 'Standard event management practices apply'
      })
    }
    
    return risks
  }

  // Advanced AI: Success probability calculation
  const calculateSuccessProbability = (venueAnalysis, weather, attendancePrediction, risks) => {
    let probability = 100
    
    // Venue suitability impact
    probability -= (100 - venueAnalysis.score) * 0.4
    
    // Weather impact
    if (weather.weather === 'stormy') probability -= 40
    else if (weather.weather === 'rainy') probability -= 20
    else if (weather.weather === 'partly_cloudy' || weather.weather === 'sunny') probability += 5
    
    // Attendance confidence impact
    probability += (attendancePrediction.confidence - 75) * 0.3
    
    // Risk impact
    const criticalRisks = risks.filter(r => r.severity === 'critical').length
    const highRisks = risks.filter(r => r.severity === 'high').length
    const mediumRisks = risks.filter(r => r.severity === 'medium').length
    
    probability -= (criticalRisks * 25 + highRisks * 15 + mediumRisks * 8)
    
    return Math.max(30, Math.min(100, Math.floor(probability)))
  }

  // Advanced AI: Generate recommendations
  const generateRecommendations = (successProb, venueAnalysis, weather, attendancePrediction, risks) => {
    const recommendations = []
    
    // Overall assessment
    if (successProb >= 85) {
      recommendations.push({
        type: 'success',
        priority: 'high',
        message: '✅ Excellent conditions - Event is highly likely to succeed',
        action: 'Proceed with current plan, ensure standard preparations'
      })
    } else if (successProb >= 70) {
      recommendations.push({
        type: 'good',
        priority: 'medium',
        message: '👍 Good setup with minor considerations',
        action: 'Address identified issues for optimal outcome'
      })
    } else if (successProb >= 50) {
      recommendations.push({
        type: 'caution',
        priority: 'high',
        message: '⚠️ Moderate risks present',
        action: 'Implement mitigation strategies or consider rescheduling'
      })
    } else {
      recommendations.push({
        type: 'warning',
        priority: 'critical',
        message: '🚨 High risk of event failure',
        action: 'Strongly recommend rescheduling or major modifications'
      })
    }
    
    // Venue recommendations
    if (venueAnalysis.status === 'poor') {
      recommendations.push({
        type: 'venue',
        priority: 'high',
        message: '📍 Current venue not suitable',
        action: venueAnalysis.covered 
          ? 'Consider outdoor venue for better capacity'
          : 'Switch to covered venue for weather protection'
      })
    }
    
    // Weather recommendations
    if (weather.weather === 'rainy' || weather.weather === 'stormy') {
      recommendations.push({
        type: 'weather',
        priority: 'high',
        message: '🌧️ Adverse weather forecast',
        action: 'Reschedule to better weather window or ensure indoor venue'
      })
    }
    
    // Attendance recommendations
    if (attendancePrediction.predicted < attendancePrediction.range[0] * 0.5) {
      recommendations.push({
        type: 'attendance',
        priority: 'medium',
        message: '👥 Low predicted turnout',
        action: 'Increase promotion, send reminders, or reschedule to weekend'
      })
    }
    
    return recommendations
  }

  const handleAnalyze = async () => {
    if (!formData.title || !formData.category || !formData.date || !formData.time || !formData.venue) {
      alert('Please fill in all required fields')
      return
    }

    setIsAnalyzing(true)
    
    // Simulate advanced AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Run all AI analyses
    const weather = predictWeather(formData.date)
    const expectedAttendees = parseInt(formData.expectedAttendees) || 50
    const venueAnalysis = analyzeVenueSuitability(formData.venue, formData.category, weather, expectedAttendees)
    const attendancePrediction = predictAttendance(formData.category, formData.date, formData.time, weather, expectedAttendees)
    const risks = assessRisks(formData.category, formData.date, formData.time, formData.venue, weather, venueAnalysis, expectedAttendees)
    const successProbability = calculateSuccessProbability(venueAnalysis, weather, attendancePrediction, risks)
    const recommendations = generateRecommendations(successProbability, venueAnalysis, weather, attendancePrediction, risks)
    
    // Generate day info
    const eventDate = new Date(formData.date)
    const dayOfWeek = eventDate.toLocaleDateString('en-US', { weekday: 'long' })
    const isWeekend = eventDate.getDay() === 0 || eventDate.getDay() === 6
    
    setAiRecommendation({
      weather,
      venueAnalysis,
      attendancePrediction,
      risks,
      successProbability,
      recommendations,
      dayOfWeek,
      isWeekend,
      overallStatus: successProbability >= 80 ? 'excellent' : successProbability >= 65 ? 'good' : successProbability >= 50 ? 'moderate' : 'poor'
    })
    
    setIsAnalyzing(false)
  }

  const handleCreateEvent = async () => {
    try {
      if (!aiRecommendation) {
        alert('Please analyze the event first')
        return
      }

      // Format weather data for Firebase
      const weatherInfo = `${aiRecommendation.weather.weather} (${aiRecommendation.weather.temperature}°C, ${aiRecommendation.weather.humidity}% humidity, ${aiRecommendation.weather.windSpeed} km/h wind)`
      
      // Format venue analysis
      const venueSummary = `${aiRecommendation.venueAnalysis.status} (${aiRecommendation.venueAnalysis.score}%) - ${aiRecommendation.venueAnalysis.type}, capacity: ${aiRecommendation.venueAnalysis.capacity}`
      
      // Format attendance prediction
      const attendanceSummary = `Predicted: ${aiRecommendation.attendancePrediction.predicted} (${aiRecommendation.attendancePrediction.range[0]}-${aiRecommendation.attendancePrediction.range[1]}) - ${aiRecommendation.attendancePrediction.confidence}% confidence`
      
      // Format risks as array of strings
      const riskSummary = aiRecommendation.risks.map(r => 
        `${r.severity.toUpperCase()}: ${r.message} (${r.probability}% probability)`
      ).join('; ')
      
      // Format recommendations as array of strings
      const recommendationsList = aiRecommendation.recommendations.map(r => 
        `${r.priority.toUpperCase()}: ${r.message} - ${r.action}`
      )
      
      // Create clean data object for Firebase
      const eventData = {
        title: formData.title,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        duration: formData.duration || 'Not specified',
        venue: formData.venue,
        expectedAttendees: parseInt(formData.expectedAttendees) || 0,
        description: formData.description || '',
        
        // AI Analysis Results (formatted for Firebase)
        aiOptimized: true,
        dayOfWeek: aiRecommendation.dayOfWeek,
        isWeekend: aiRecommendation.isWeekend,
        
        // Weather data
        weatherForecast: weatherInfo,
        weatherCondition: aiRecommendation.weather.weather,
        temperature: aiRecommendation.weather.temperature,
        rainfall: aiRecommendation.weather.rainfall,
        
        // Venue analysis
        venueSuitability: venueSummary,
        venueScore: aiRecommendation.venueAnalysis.score,
        venueStatus: aiRecommendation.venueAnalysis.status,
        venueCovered: aiRecommendation.venueAnalysis.covered,
        venueCapacity: aiRecommendation.venueAnalysis.capacity,
        
        // Attendance prediction
        attendanceAnalysis: attendanceSummary,
        predictedAttendance: aiRecommendation.attendancePrediction.predicted,
        attendanceConfidence: aiRecommendation.attendancePrediction.confidence,
        attendanceMin: aiRecommendation.attendancePrediction.range[0],
        attendanceMax: aiRecommendation.attendancePrediction.range[1],
        
        // Risk assessment
        riskAssessment: riskSummary,
        riskCount: aiRecommendation.risks.length,
        highRisks: aiRecommendation.risks.filter(r => r.severity === 'high' || r.severity === 'critical').length,
        
        // Success metrics
        successProbability: aiRecommendation.successProbability,
        overallStatus: aiRecommendation.overallStatus,
        
        // Recommendations
        recommendations: recommendationsList
        
        // NOTE: createdBy will be automatically set by eventsService.createEvent()
        // to the Firebase Auth UID (auth.currentUser?.uid)
      }

      console.log('Creating event with data:', { ...eventData, createdBy: '(will be set by service)' })
      const result = await eventsService.createEvent(eventData)
      console.log('Event created successfully:', result)
      
      alert(`✅ Event created successfully!\n\nSuccess Probability: ${aiRecommendation.successProbability}%\nPredicted Attendance: ${aiRecommendation.attendancePrediction.predicted} people`)
      navigate('/events')
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.\n\nError: ' + error.message)
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
            {/* Overall Status */}
            <div className={`${
              aiRecommendation.overallStatus === 'excellent' 
                ? isDarkMode ? 'bg-green-950/50 border-green-700/50' : 'bg-green-50 border-green-300'
                : aiRecommendation.overallStatus === 'good'
                ? isDarkMode ? 'bg-blue-950/50 border-blue-700/50' : 'bg-blue-50 border-blue-300'
                : aiRecommendation.overallStatus === 'moderate'
                ? isDarkMode ? 'bg-yellow-950/50 border-yellow-700/50' : 'bg-yellow-50 border-yellow-300'
                : isDarkMode ? 'bg-red-950/50 border-red-700/50' : 'bg-red-50 border-red-300'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <div className="flex items-start space-x-3">
                {aiRecommendation.overallStatus === 'excellent' ? (
                  <CheckCircle className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                ) : aiRecommendation.overallStatus === 'good' ? (
                  <TrendingUp className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                ) : aiRecommendation.overallStatus === 'moderate' ? (
                  <AlertCircle className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                ) : (
                  <AlertTriangle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                )}
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-1 ${
                    aiRecommendation.overallStatus === 'excellent' 
                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                      : aiRecommendation.overallStatus === 'good'
                      ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      : aiRecommendation.overallStatus === 'moderate'
                      ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      : isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    AI Event Analysis Complete
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {aiRecommendation.dayOfWeek}, {formData.date} • {aiRecommendation.isWeekend ? 'Weekend Event' : 'Weekday Event'}
                  </p>
                </div>
              </div>
            </div>

            {/* Success Probability */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Target className={`w-5 h-5 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <span className={`text-sm font-semibold ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Event Success Probability
                  </span>
                </div>
                <span className={`text-2xl font-bold ${
                  aiRecommendation.successProbability >= 80 
                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                    : aiRecommendation.successProbability >= 65
                    ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    : aiRecommendation.successProbability >= 50
                    ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    : isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {aiRecommendation.successProbability}%
                </span>
              </div>
              <div className={`w-full rounded-full h-4 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className={`${
                    aiRecommendation.successProbability >= 80
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : aiRecommendation.successProbability >= 65
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                      : aiRecommendation.successProbability >= 50
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                      : 'bg-gradient-to-r from-red-500 to-red-600'
                  } h-4 rounded-full transition-all flex items-center justify-end pr-2`}
                  style={{ width: `${aiRecommendation.successProbability}%` }}
                >
                  <Star className="w-3 h-3 text-white" />
                </div>
              </div>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Based on weather, venue suitability, attendance prediction, and risk factors
              </p>
            </div>

            {/* Weather Forecast Card */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h4 className={`font-semibold mb-3 flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {aiRecommendation.weather.weather === 'sunny' ? (
                  <Sun className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                ) : aiRecommendation.weather.weather === 'rainy' || aiRecommendation.weather.weather === 'stormy' ? (
                  <CloudRain className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                ) : (
                  <Cloud className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
                <span>Weather Forecast</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Condition</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {aiRecommendation.weather.weather.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </p>
                </div>
                <div>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Temperature</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {aiRecommendation.weather.temperature}°C
                  </p>
                </div>
                <div>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Wind Speed</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {aiRecommendation.weather.windSpeed} km/h
                  </p>
                </div>
                <div>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Humidity</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {aiRecommendation.weather.humidity}%
                  </p>
                </div>
              </div>
              {aiRecommendation.weather.rainfall > 0 && (
                <div className={`mt-3 p-2 rounded-lg ${
                  isDarkMode ? 'bg-blue-950/50' : 'bg-blue-50'
                }`}>
                  <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    ⚠️ Expected rainfall: {aiRecommendation.weather.rainfall}mm
                  </p>
                </div>
              )}
            </div>

            {/* Venue Suitability */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold flex items-center space-x-2 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <MapPin className="w-5 h-5" />
                  <span>Venue Suitability Analysis</span>
                </h4>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  aiRecommendation.venueAnalysis.status === 'excellent'
                    ? isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                    : aiRecommendation.venueAnalysis.status === 'good'
                    ? isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'
                    : aiRecommendation.venueAnalysis.status === 'acceptable'
                    ? isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                    : isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'
                }`}>
                  {aiRecommendation.venueAnalysis.score}% Match
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {aiRecommendation.venueAnalysis.type}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Capacity</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {aiRecommendation.venueAnalysis.capacity}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coverage</p>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {aiRecommendation.venueAnalysis.covered ? 'Indoor' : 'Outdoor'}
                  </p>
                </div>
              </div>

              {aiRecommendation.venueAnalysis.benefits.length > 0 && (
                <div className={`mb-3 p-3 rounded-lg ${isDarkMode ? 'bg-green-950/30' : 'bg-green-50'}`}>
                  <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                    ✅ Advantages
                  </p>
                  {aiRecommendation.venueAnalysis.benefits.map((benefit, idx) => (
                    <p key={idx} className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                      • {benefit}
                    </p>
                  ))}
                </div>
              )}

              {aiRecommendation.venueAnalysis.issues.length > 0 && (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-yellow-950/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    ⚠️ Considerations
                  </p>
                  {aiRecommendation.venueAnalysis.issues.map((issue, idx) => (
                    <div key={idx} className="mb-2 last:mb-0">
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                        {issue.message}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`}>
                        Impact: {issue.impact}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance Prediction */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h4 className={`font-semibold mb-3 flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <Users className="w-5 h-5" />
                <span>Attendance Prediction</span>
              </h4>
              
              <div className={`p-4 rounded-lg mb-3 ${
                isDarkMode ? 'bg-purple-950/50' : 'bg-purple-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expected
                  </span>
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {aiRecommendation.attendancePrediction.predicted}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Range: {aiRecommendation.attendancePrediction.range[0]}-{aiRecommendation.attendancePrediction.range[1]}
                  </span>
                  <span className={`font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {aiRecommendation.attendancePrediction.confidence}% confidence
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Influencing Factors:
                </p>
                {aiRecommendation.attendancePrediction.factors.map((factor, idx) => (
                  <div key={idx} className={`flex items-center justify-between text-xs p-2 rounded ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                  }`}>
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {factor.factor}
                    </span>
                    <span className={`font-bold ${
                      factor.positive 
                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                        : isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {factor.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h4 className={`font-semibold mb-3 flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <AlertTriangle className="w-5 h-5" />
                <span>Risk Assessment ({aiRecommendation.risks.length})</span>
              </h4>
              
              {aiRecommendation.risks.map((risk, idx) => (
                <div key={idx} className={`mb-3 last:mb-0 p-3 rounded-lg border ${
                  risk.severity === 'critical'
                    ? isDarkMode ? 'bg-red-950/50 border-red-700' : 'bg-red-50 border-red-300'
                    : risk.severity === 'high'
                    ? isDarkMode ? 'bg-orange-950/50 border-orange-700' : 'bg-orange-50 border-orange-300'
                    : risk.severity === 'medium'
                    ? isDarkMode ? 'bg-yellow-950/50 border-yellow-700' : 'bg-yellow-50 border-yellow-300'
                    : isDarkMode ? 'bg-green-950/50 border-green-700' : 'bg-green-50 border-green-300'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className={`text-sm font-semibold ${
                      risk.severity === 'critical'
                        ? isDarkMode ? 'text-red-300' : 'text-red-800'
                        : risk.severity === 'high'
                        ? isDarkMode ? 'text-orange-300' : 'text-orange-800'
                        : risk.severity === 'medium'
                        ? isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                        : isDarkMode ? 'text-green-300' : 'text-green-800'
                    }`}>
                      {risk.message}
                    </p>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      risk.severity === 'critical'
                        ? isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-200 text-red-800'
                        : risk.severity === 'high'
                        ? isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-200 text-orange-800'
                        : risk.severity === 'medium'
                        ? isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-200 text-yellow-800'
                        : isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-200 text-green-800'
                    }`}>
                      {risk.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className={`text-xs mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Probability: {risk.probability}%
                  </p>
                  <div className={`p-2 rounded ${
                    isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
                  }`}>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      💡 <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendations */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h4 className={`font-semibold mb-3 flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <Sparkles className="w-5 h-5" />
                <span>AI Recommendations</span>
              </h4>
              
              <div className="space-y-3">
                {aiRecommendation.recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${
                    rec.priority === 'critical'
                      ? isDarkMode ? 'bg-red-950/30 border-red-700' : 'bg-red-50 border-red-300'
                      : rec.priority === 'high'
                      ? isDarkMode ? 'bg-orange-950/30 border-orange-700' : 'bg-orange-50 border-orange-300'
                      : isDarkMode ? 'bg-blue-950/30 border-blue-700' : 'bg-blue-50 border-blue-300'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <Zap className={`w-4 h-4 mt-0.5 ${
                        rec.priority === 'critical'
                          ? isDarkMode ? 'text-red-400' : 'text-red-600'
                          : rec.priority === 'high'
                          ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
                          : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium mb-1 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {rec.message}
                        </p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          → {rec.action}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
