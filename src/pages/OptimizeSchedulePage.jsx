import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Calendar, Users, MapPin, TrendingUp, ArrowLeft, Loader2, Cloud, Sun, CloudRain, Wind, AlertTriangle, CheckCircle, Truck, Clock, Route } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import foodAidService from '../services/foodAidService'

const PUROKS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5']

// Purok characteristics for advanced AI analysis
const PUROK_DATA = {
  'Purok 1': { distance: 2.5, terrain: 'flat', accessibility: 'excellent', avgFamilies: 24, population: 120 },
  'Purok 2': { distance: 1.8, terrain: 'flat', accessibility: 'excellent', avgFamilies: 18, population: 90 },
  'Purok 3': { distance: 4.2, terrain: 'hilly', accessibility: 'moderate', avgFamilies: 31, population: 155 },
  'Purok 4': { distance: 3.5, terrain: 'mixed', accessibility: 'good', avgFamilies: 28, population: 140 },
  'Purok 5': { distance: 3.0, terrain: 'flat', accessibility: 'good', avgFamilies: 22, population: 110 }
}

const OptimizeSchedulePage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    selectedPuroks: [],
    startDate: '',
    endDate: '',
    totalFamilies: '',
    notes: ''
  })
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  const handlePurokToggle = (purok) => {
    setFormData(prev => ({
      ...prev,
      selectedPuroks: prev.selectedPuroks.includes(purok)
        ? prev.selectedPuroks.filter(p => p !== purok)
        : [...prev.selectedPuroks, purok]
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Advanced AI: Weather prediction simulation
  const predictWeather = (date) => {
    const weatherTypes = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'stormy']
    const dayOfWeek = new Date(date).getDay()
    
    // Simulate weather patterns (rainy days more likely on certain days)
    let weatherIndex
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weatherIndex = Math.floor(Math.random() * 3) // Weekend: better weather
    } else {
      weatherIndex = Math.floor(Math.random() * weatherTypes.length)
    }
    
    const weather = weatherTypes[weatherIndex]
    const temperature = weather === 'sunny' ? 32 : weather === 'rainy' ? 24 : 28
    const humidity = weather === 'rainy' ? 85 : weather === 'sunny' ? 65 : 75
    
    return { weather, temperature, humidity }
  }

  // Advanced AI: Route complexity analysis
  const analyzeRoute = (purok) => {
    const data = PUROK_DATA[purok]
    let complexity = 'simple'
    let routeDetails = ''
    let estimatedTime = 0
    
    if (data.terrain === 'hilly' && data.distance > 3) {
      complexity = 'complex'
      routeDetails = 'Steep terrain, multiple turns, narrow paths'
      estimatedTime = Math.ceil(data.distance * 25) // minutes
    } else if (data.terrain === 'mixed' || data.distance > 3) {
      complexity = 'moderate'
      routeDetails = 'Mixed terrain, some elevation changes'
      estimatedTime = Math.ceil(data.distance * 20)
    } else {
      complexity = 'simple'
      routeDetails = 'Flat terrain, straightforward path'
      estimatedTime = Math.ceil(data.distance * 15)
    }
    
    return { complexity, routeDetails, estimatedTime, distance: data.distance }
  }

  // Advanced AI: Risk assessment
  const assessRisks = (purok, weather, families, date) => {
    const risks = []
    const data = PUROK_DATA[purok]
    
    // Weather risks
    if (weather.weather === 'rainy' || weather.weather === 'stormy') {
      risks.push({
        type: 'weather',
        severity: weather.weather === 'stormy' ? 'high' : 'medium',
        description: 'Adverse weather conditions may delay distribution',
        mitigation: 'Have backup date ready, bring raincoats and tarps'
      })
    }
    
    // Accessibility risks
    if (data.accessibility === 'moderate' && (weather.weather === 'rainy' || weather.weather === 'stormy')) {
      risks.push({
        type: 'accessibility',
        severity: 'high',
        description: 'Road conditions may become difficult in bad weather',
        mitigation: 'Consider 4x4 vehicle, inform residents of possible delay'
      })
    }
    
    // Capacity risks
    if (families > data.avgFamilies * 1.5) {
      risks.push({
        type: 'capacity',
        severity: 'medium',
        description: `High family count (${families} vs typical ${data.avgFamilies})`,
        mitigation: 'Deploy additional personnel, increase supplies'
      })
    }
    
    // Distance risks
    if (data.distance > 3.5) {
      risks.push({
        type: 'logistics',
        severity: 'low',
        description: 'Long distance may require fuel and time buffer',
        mitigation: 'Ensure vehicle is fueled, allocate extra 30 minutes'
      })
    }
    
    return risks
  }

  // Advanced AI: Optimal time slot selection
  const determineOptimalTimeSlot = (purok, weather, dayIndex) => {
    const data = PUROK_DATA[purok]
    let timeSlot = ''
    let reasoning = ''
    
    if (weather.weather === 'sunny' && weather.temperature > 30) {
      timeSlot = 'Early Morning (7AM-9AM)'
      reasoning = 'Beat the heat - cooler temperatures for residents and volunteers'
    } else if (weather.weather === 'rainy') {
      timeSlot = 'Late Morning (10AM-12PM)'
      reasoning = 'Rain typically lighter mid-morning, better visibility'
    } else if (data.terrain === 'hilly') {
      timeSlot = 'Morning (8AM-10AM)'
      reasoning = 'Better daylight for navigating difficult terrain'
    } else if (dayIndex % 2 === 0) {
      timeSlot = 'Morning (8AM-10AM)'
      reasoning = 'Optimal time for resident availability'
    } else {
      timeSlot = 'Afternoon (2PM-4PM)'
      reasoning = 'Balanced schedule distribution across days'
    }
    
    return { timeSlot, reasoning }
  }

  // Advanced AI: Calculate efficiency score
  const calculateEfficiency = (purok, weather, families, route, risks) => {
    let score = 100
    const data = PUROK_DATA[purok]
    
    // Weather impact
    if (weather.weather === 'stormy') score -= 25
    else if (weather.weather === 'rainy') score -= 15
    else if (weather.weather === 'cloudy') score -= 5
    else if (weather.weather === 'sunny') score -= 2 // slight reduction due to heat
    
    // Route complexity impact
    if (route.complexity === 'complex') score -= 15
    else if (route.complexity === 'moderate') score -= 8
    
    // Accessibility impact
    if (data.accessibility === 'moderate') score -= 10
    else if (data.accessibility === 'good') score -= 3
    
    // Family density impact (too many or too few is less efficient)
    const familyRatio = families / data.avgFamilies
    if (familyRatio > 1.5 || familyRatio < 0.5) score -= 10
    
    // Risk impact
    const highRisks = risks.filter(r => r.severity === 'high').length
    const mediumRisks = risks.filter(r => r.severity === 'medium').length
    score -= (highRisks * 10 + mediumRisks * 5)
    
    // Ensure score is between 0-100
    return Math.max(40, Math.min(100, Math.floor(score)))
  }

  // Advanced AI: Generate optimization recommendations
  const generateRecommendations = (schedules) => {
    const recommendations = []
    const avgEfficiency = schedules.reduce((sum, s) => sum + s.efficiencyScore, 0) / schedules.length
    
    // Overall assessment
    if (avgEfficiency >= 85) {
      recommendations.push({
        type: 'success',
        message: '✅ Excellent schedule! High efficiency across all days',
        action: 'Proceed with this optimized distribution plan'
      })
    } else if (avgEfficiency >= 70) {
      recommendations.push({
        type: 'good',
        message: '👍 Good schedule with minor optimization opportunities',
        action: 'Consider the suggested improvements below'
      })
    } else {
      recommendations.push({
        type: 'warning',
        message: '⚠️ Schedule has significant challenges',
        action: 'Review high-risk days and consider rescheduling'
      })
    }
    
    // Weather-based recommendations
    const rainyDays = schedules.filter(s => s.weather.weather === 'rainy' || s.weather.weather === 'stormy').length
    if (rainyDays > schedules.length / 2) {
      recommendations.push({
        type: 'weather',
        message: `🌧️ ${rainyDays} days have rain forecast`,
        action: 'Consider shifting schedule to better weather window or prepare rain contingency'
      })
    }
    
    // High-risk schedules
    const highRiskSchedules = schedules.filter(s => s.risks.some(r => r.severity === 'high'))
    if (highRiskSchedules.length > 0) {
      recommendations.push({
        type: 'risk',
        message: `⚠️ ${highRiskSchedules.length} high-risk distribution${highRiskSchedules.length > 1 ? 's' : ''} detected`,
        action: `Priority attention needed for: ${highRiskSchedules.map(s => s.purok).join(', ')}`
      })
    }
    
    // Resource optimization
    const totalTime = schedules.reduce((sum, s) => sum + s.routeAnalysis.estimatedTime, 0)
    if (totalTime > 300) { // more than 5 hours total
      recommendations.push({
        type: 'logistics',
        message: '🚚 Total distribution time is significant',
        action: 'Consider deploying multiple teams or spreading over more days'
      })
    }
    
    return recommendations
  }

  const handleAnalyze = async () => {
    if (formData.selectedPuroks.length === 0 || !formData.startDate || !formData.endDate || !formData.totalFamilies) {
      alert('Please fill in all required fields')
      return
    }

    setIsAnalyzing(true)
    
    // Simulate advanced AI analysis with progress
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Sort puroks by optimal distribution order (distance and accessibility)
    const sortedPuroks = [...formData.selectedPuroks].sort((a, b) => {
      const dataA = PUROK_DATA[a]
      const dataB = PUROK_DATA[b]
      // Prioritize closer, more accessible puroks first
      const scoreA = dataA.distance * (dataA.accessibility === 'excellent' ? 0.8 : dataA.accessibility === 'good' ? 1 : 1.2)
      const scoreB = dataB.distance * (dataB.accessibility === 'excellent' ? 0.8 : dataB.accessibility === 'good' ? 1 : 1.2)
      return scoreA - scoreB
    })
    
    // Intelligent family distribution based on purok population
    const totalPopulation = sortedPuroks.reduce((sum, purok) => sum + PUROK_DATA[purok].population, 0)
    
    const schedules = sortedPuroks.map((purok, index) => {
      const date = new Date(formData.startDate)
      date.setDate(date.getDate() + index)
      const dateStr = date.toISOString().split('T')[0]
      
      // Proportional family distribution based on population
      const purokData = PUROK_DATA[purok]
      const proportionalFamilies = Math.round((purokData.population / totalPopulation) * formData.totalFamilies)
      
      // Get AI predictions and analysis
      const weather = predictWeather(dateStr)
      const routeAnalysis = analyzeRoute(purok)
      const optimalTime = determineOptimalTimeSlot(purok, weather, index)
      const risks = assessRisks(purok, weather, proportionalFamilies, dateStr)
      const efficiencyScore = calculateEfficiency(purok, weather, proportionalFamilies, routeAnalysis, risks)
      
      return {
        purok,
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        timeSlot: optimalTime.timeSlot,
        timeReasoning: optimalTime.reasoning,
        families: proportionalFamilies,
        weather,
        routeAnalysis,
        risks,
        efficiencyScore,
        status: efficiencyScore >= 75 ? 'optimal' : efficiencyScore >= 60 ? 'acceptable' : 'challenging'
      }
    })
    
    // Generate comprehensive recommendations
    const recommendations = generateRecommendations(schedules)
    const averageEfficiency = Math.floor(schedules.reduce((acc, s) => acc + s.efficiencyScore, 0) / schedules.length)
    
    setAnalysisResult({
      schedules,
      totalDays: schedules.length,
      averageEfficiency,
      recommendations,
      totalDistance: schedules.reduce((sum, s) => sum + s.routeAnalysis.distance, 0).toFixed(1),
      totalTime: schedules.reduce((sum, s) => sum + s.routeAnalysis.estimatedTime, 0),
      overallStatus: averageEfficiency >= 80 ? 'excellent' : averageEfficiency >= 65 ? 'good' : 'challenging'
    })
    
    setIsAnalyzing(false)
  }

  const handleSaveSchedule = async () => {
    try {
      if (!analysisResult) {
        alert('Please analyze the schedule first')
        return
      }

      // Save all schedules to Firebase with properly formatted data
      const savePromises = analysisResult.schedules.map(schedule => {
        // Format weather info as string for Firebase
        const weatherInfo = `${schedule.weather.weather} (${schedule.weather.temperature}°C, ${schedule.weather.humidity}% humidity)`
        
        // Format risks as a simple array of strings
        const riskSummary = schedule.risks.map(r => 
          `${r.severity.toUpperCase()}: ${r.description}`
        ).join('; ') || 'No significant risks'
        
        // Create clean data object for Firebase
        return foodAidService.createFoodAidSchedule({
          purok: schedule.purok,
          date: schedule.date,
          dayName: schedule.dayName,
          timeSlot: schedule.timeSlot,
          totalFamilies: schedule.families,
          route: schedule.routeAnalysis.routeDetails,
          routeComplexity: schedule.routeAnalysis.complexity,
          routeDistance: schedule.routeAnalysis.distance,
          estimatedTime: schedule.routeAnalysis.estimatedTime,
          weatherForecast: weatherInfo,
          weatherCondition: schedule.weather.weather,
          timeReasoning: schedule.timeReasoning,
          riskAssessment: riskSummary,
          riskCount: schedule.risks.length,
          efficiencyScore: schedule.efficiencyScore,
          scheduleStatus: schedule.status,
          notes: formData.notes || '',
          createdByName: user?.fullName,
          // Store original notes for reference
          aiOptimized: true,
          totalScheduleDays: analysisResult.totalDays,
          overallEfficiency: analysisResult.averageEfficiency
        })
      })

      await Promise.all(savePromises)
      
      alert(`✅ Successfully saved ${analysisResult.schedules.length} optimized schedules!\n\nAverage efficiency: ${analysisResult.averageEfficiency}%`)
      navigate('/food-aid')
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule. Please try again.\n\nError: ' + error.message)
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

      <div className="p-4 space-y-4 pb-24">
        {/* Back Button */}
        <button
          onClick={() => navigate('/food-aid')}
          className={`flex items-center space-x-2 ${
            isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-100 hover:text-white'
          } transition`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Food Aid</span>
        </button>

        {/* Header */}
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-green-900/90 to-emerald-950/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-green-500/90 to-green-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">Optimize Distribution Schedule</h2>
          </div>
          <p className={isDarkMode ? 'text-green-200' : 'text-green-100'}>
            AI-Powered Smart Scheduling
          </p>
        </div>

        {/* Form Section */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-lg p-4 border shadow-lg space-y-4`}>
          
          {/* Purok Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Select Puroks <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PUROKS.map(purok => (
                <button
                  key={purok}
                  onClick={() => handlePurokToggle(purok)}
                  className={`p-3 rounded-lg border-2 font-medium text-sm transition ${
                    formData.selectedPuroks.includes(purok)
                      ? isDarkMode 
                        ? 'bg-green-900/50 border-green-600 text-green-300'
                        : 'bg-green-100 border-green-500 text-green-700'
                      : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {purok}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-green-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-green-500`}
              />
            </div>
          </div>

          {/* Total Families */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Total Families to Serve <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="totalFamilies"
              value={formData.totalFamilies}
              onChange={handleInputChange}
              placeholder="e.g., 100"
              min="1"
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any special considerations or requirements..."
              rows="3"
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-green-500 resize-none`}
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full ${
              isDarkMode 
                ? 'bg-green-900/90 hover:bg-green-800 border-gray-700/50' 
                : 'bg-green-500/90 hover:bg-green-600 border-white/20'
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
                <span>Analyze Schedule</span>
              </>
            )}
          </button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className={`${
              analysisResult.overallStatus === 'excellent' 
                ? isDarkMode ? 'bg-green-950/50 border-green-700/50' : 'bg-green-50 border-green-300'
                : analysisResult.overallStatus === 'good'
                ? isDarkMode ? 'bg-blue-950/50 border-blue-700/50' : 'bg-blue-50 border-blue-300'
                : isDarkMode ? 'bg-yellow-950/50 border-yellow-700/50' : 'bg-yellow-50 border-yellow-300'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <div className="flex items-start space-x-3">
                {analysisResult.overallStatus === 'excellent' ? (
                  <CheckCircle className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                ) : analysisResult.overallStatus === 'good' ? (
                  <TrendingUp className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                ) : (
                  <AlertTriangle className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                )}
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-1 ${
                    analysisResult.overallStatus === 'excellent' 
                      ? isDarkMode ? 'text-green-400' : 'text-green-600'
                      : analysisResult.overallStatus === 'good'
                      ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`}>
                    AI-Optimized Distribution Schedule
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {analysisResult.overallStatus === 'excellent' 
                      ? 'Optimal schedule with high efficiency across all distributions'
                      : analysisResult.overallStatus === 'good'
                      ? 'Good schedule with acceptable efficiency ratings'
                      : 'Schedule has some challenges - review recommendations carefully'}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                📊 Distribution Summary
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Calendar className="w-4 h-4" />
                  <span><strong>{analysisResult.totalDays}</strong> days</span>
                </div>
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span><strong>{analysisResult.averageEfficiency}%</strong> efficiency</span>
                </div>
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Route className="w-4 h-4" />
                  <span><strong>{analysisResult.totalDistance} km</strong> total</span>
                </div>
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Clock className="w-4 h-4" />
                  <span><strong>{Math.floor(analysisResult.totalTime / 60)}h {analysisResult.totalTime % 60}m</strong> time</span>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
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
                  {analysisResult.recommendations.map((rec, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}>
                      <p className={`font-medium text-sm mb-1 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {rec.message}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        💡 {rec.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Cards */}
            {analysisResult.schedules.map((schedule, index) => (
              <div
                key={index}
                className={`${
                  isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}
              >
                {/* Header with Status Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className={`font-bold text-lg ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      {schedule.purok}
                    </h4>
                    <div className={`flex items-center space-x-2 mt-1 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      <span>{schedule.dayName}, {schedule.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      schedule.status === 'optimal'
                        ? isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                        : schedule.status === 'acceptable'
                        ? isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'
                        : isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {schedule.efficiencyScore}% Efficiency
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {schedule.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Weather & Time Info */}
                <div className={`grid grid-cols-2 gap-3 mb-3 p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      {schedule.weather.weather === 'sunny' ? (
                        <Sun className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                      ) : schedule.weather.weather === 'rainy' || schedule.weather.weather === 'stormy' ? (
                        <CloudRain className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                      ) : schedule.weather.weather === 'cloudy' ? (
                        <Cloud className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      ) : (
                        <Cloud className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {schedule.weather.weather.replace('_', ' ').charAt(0).toUpperCase() + schedule.weather.weather.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {schedule.weather.temperature}°C, {schedule.weather.humidity}% humidity
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {schedule.timeSlot}
                      </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {schedule.timeReasoning}
                    </p>
                  </div>
                </div>

                {/* Distribution Details */}
                <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span><strong>{schedule.families}</strong> families</span>
                    </div>
                    <span className="text-xs">{PUROK_DATA[schedule.purok].population} residents</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span><strong>{schedule.routeAnalysis.distance} km</strong> distance</span>
                    </div>
                    <span className="text-xs">{schedule.routeAnalysis.estimatedTime} min estimated</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Truck className="w-4 h-4 mt-0.5" />
                    <div className="flex-1">
                      <strong>Route:</strong> {schedule.routeAnalysis.routeDetails}
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                        schedule.routeAnalysis.complexity === 'simple'
                          ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                          : schedule.routeAnalysis.complexity === 'moderate'
                          ? isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                          : isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                      }`}>
                        {schedule.routeAnalysis.complexity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                {schedule.risks && schedule.risks.length > 0 && (
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <h5 className={`text-xs font-semibold mb-2 flex items-center space-x-1 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Risk Assessment ({schedule.risks.length})</span>
                    </h5>
                    <div className="space-y-2">
                      {schedule.risks.map((risk, riskIdx) => (
                        <div key={riskIdx} className="text-xs">
                          <div className="flex items-start justify-between mb-1">
                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                              {risk.description}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              risk.severity === 'high'
                                ? isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'
                                : risk.severity === 'medium'
                                ? isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                : isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {risk.severity}
                            </span>
                          </div>
                          <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                            💡 {risk.mitigation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/food-aid')}
                className={`${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300' 
                    : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
                } backdrop-blur-sm font-semibold py-3 rounded-xl transition shadow-xl border`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className={`${
                  isDarkMode 
                    ? 'bg-green-900/90 hover:bg-green-800 border-gray-700/50' 
                    : 'bg-green-500/90 hover:bg-green-600 border-white/20'
                } backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition shadow-xl border`}
              >
                Save Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OptimizeSchedulePage
