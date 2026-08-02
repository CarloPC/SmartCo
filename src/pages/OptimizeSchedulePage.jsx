
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Sparkles, Calendar, Users, MapPin, TrendingUp, ArrowLeft, Loader2,
  Cloud, Sun, CloudRain, Wind, AlertTriangle, CheckCircle, Truck,
  Clock, Route, Navigation, RefreshCw, AlertCircle, Map, ChevronRight
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import foodAidService from '../services/foodAidService'
import {
  TOLEDO_BARANGAYS, PUROKS_LIST, PUROK_COORDS,
  getPositionAsync, detectNearestBarangay,
  haversineDistance, nearestNeighborRoute, estimateTravelTime, DISTRIBUTION_HUB
} from '../utils/locationUtils'

// Fix Leaflet default icons for Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Numbered stop icon for route map
const makeStopIcon = (num, color) =>
  L.divIcon({
    html: '<div style="width:30px;height:30px;background:' + color + ';border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.4)">' + num + '</div>',
    className: '',
    iconSize:   [30, 30],
    iconAnchor: [15, 15],
  })

const START_ICON = L.divIcon({
  html: '<div style="width:28px;height:28px;background:#3b82f6;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
  className: '',
  iconSize:   [28, 28],
  iconAnchor: [14, 14],
})

const STOP_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#ec4899']

// Area-to-approximate coordinates for legacy support
const PUROK_DATA = {
  'Sitio Proper Ilihan': { distance: 2.5, terrain: 'flat',        accessibility: 'excellent', avgFamilies: 24, population: 120, lat: 10.3737, lng: 123.6384 },
  'Cabulihan Uno':       { distance: 1.8, terrain: 'flat',        accessibility: 'excellent', avgFamilies: 18, population: 90,  lat: 10.3825, lng: 123.6547 },
  'Cabulihan Dos':       { distance: 4.2, terrain: 'hilly',       accessibility: 'moderate',  avgFamilies: 31, population: 155, lat: 10.3508, lng: 123.6073 },
  'Sitio Mangga':        { distance: 3.5, terrain: 'mixed',       accessibility: 'good',      avgFamilies: 28, population: 140, lat: 10.3643, lng: 123.6712 },
  'Sambag Ilihan':       { distance: 3.0, terrain: 'flat',        accessibility: 'good',      avgFamilies: 22, population: 110, lat: 10.3889, lng: 123.6089 },
}
const PUROKS = Object.keys(PUROK_DATA)

// Map auto-fit helper
function MapFit({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40] })
    } else if (positions.length === 1) {
      map.setView(positions[0], 14)
    }
  }, [positions, map])
  return null
}

const OptimizeSchedulePage = () => {
  const { isDarkMode } = useTheme()
  const navigate       = useNavigate()
  const { user }       = useAuth()

  // GPS start location
  const [gpsStatus,    setGpsStatus]    = useState('idle')  // idle | detecting | success | error
  const [startCoords,  setStartCoords]  = useState(null)
  const [startBarangay, setStartBarangay] = useState(null)
  const [manualStart,  setManualStart]  = useState('')

  const [formData, setFormData] = useState({
    selectedPuroks: [],
    startDate: '',
    endDate: '',
    totalFamilies: '',
    notes: ''
  })

  const [isAnalyzing,   setIsAnalyzing]   = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [showMap,       setShowMap]       = useState(false)

  useEffect(() => { autoDetectGPS() }, [])

  // GPS detection 
  const autoDetectGPS = async () => {
    setGpsStatus('detecting')
    try {
      const coords = await getPositionAsync()
      setStartCoords(coords)
      setStartBarangay(detectNearestBarangay(coords.lat, coords.lng))
      setGpsStatus('success')
    } catch {
      setGpsStatus('error')
    }
  }

  const handleManualStartSelect = id => {
    setManualStart(id)
    const b = TOLEDO_BARANGAYS.find(b => b.id === id)
    if (b) {
      setStartBarangay(b)
      setStartCoords({ lat: b.lat, lng: b.lng, accuracy: null })
    }
  }

  //  Form helpers 
  const handlePurokToggle = purok => {
    setFormData(prev => ({
      ...prev,
      selectedPuroks: prev.selectedPuroks.includes(purok)
        ? prev.selectedPuroks.filter(p => p !== purok)
        : [...prev.selectedPuroks, purok]
    }))
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  //  AI helpers 
  const predictWeather = date => {
    const types   = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'stormy']
    const day     = new Date(date).getDay()
    const idx     = (day === 0 || day === 6) ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * types.length)
    const weather = types[idx]
    return {
      weather,
      temperature: weather === 'sunny' ? 32 : weather === 'rainy' ? 24 : 28,
      humidity:    weather === 'rainy' ? 85 : weather === 'sunny' ? 65 : 75,
    }
  }

  const assessRisks = (purok, weather, families) => {
    const data  = PUROK_DATA[purok]
    const risks = []
    if (weather.weather === 'rainy' || weather.weather === 'stormy') {
      risks.push({ type: 'weather', severity: weather.weather === 'stormy' ? 'high' : 'medium',
        description: 'Adverse weather may delay distribution', mitigation: 'Have backup date ready, bring raincoats' })
    }
    if (data.accessibility === 'moderate' && (weather.weather === 'rainy' || weather.weather === 'stormy')) {
      risks.push({ type: 'accessibility', severity: 'high',
        description: 'Roads may become difficult in bad weather', mitigation: 'Consider 4Ã—4 vehicle, alert residents of possible delay' })
    }
    if (families > data.avgFamilies * 1.5) {
      risks.push({ type: 'capacity', severity: 'medium',
        description: 'High family count (' + families + ' vs typical ' + data.avgFamilies + ')',
        mitigation: 'Deploy additional personnel, increase supplies' })
    }
    if (data.distance > 3.5) {
      risks.push({ type: 'logistics', severity: 'low',
        description: 'Long distance requires extra time buffer', mitigation: 'Ensure vehicle is fueled, add 30 min buffer' })
    }
    return risks
  }

  const determineOptimalTime = (purok, weather, dayIndex) => {
    const data = PUROK_DATA[purok]
    if (weather.weather === 'sunny' && weather.temperature > 30) return { timeSlot: 'Early Morning (7AM-9AM)',    reasoning: 'Beat the heat for residents and volunteers' }
    if (weather.weather === 'rainy')                              return { timeSlot: 'Late Morning (10AM-12PM)',   reasoning: 'Rain typically lighter mid-morning' }
    if (data.terrain === 'hilly')                                 return { timeSlot: 'Morning (8AM-10AM)',         reasoning: 'Better daylight for navigating terrain' }
    return dayIndex % 2 === 0
      ? { timeSlot: 'Morning (8AM-10AM)',   reasoning: 'Optimal time for resident availability' }
      : { timeSlot: 'Afternoon (2PM-4PM)', reasoning: 'Balanced schedule across days' }
  }

  const calcEfficiency = (purok, weather, families, risks) => {
    const data = PUROK_DATA[purok]
    let score  = 100
    if      (weather.weather === 'stormy')       score -= 25
    else if (weather.weather === 'rainy')        score -= 15
    else if (weather.weather === 'cloudy')       score -= 5
    else if (weather.weather === 'sunny')        score -= 2
    if (data.terrain === 'hilly')                score -= 10
    else if (data.terrain === 'mixed')           score -= 5
    if (data.accessibility === 'moderate')       score -= 10
    else if (data.accessibility === 'good')      score -= 3
    const ratio = families / data.avgFamilies
    if (ratio > 1.5 || ratio < 0.5)             score -= 10
    const highRisks   = risks.filter(r => r.severity === 'high').length
    const mediumRisks = risks.filter(r => r.severity === 'medium').length
    score -= highRisks * 10 + mediumRisks * 5
    return Math.max(40, Math.min(100, Math.floor(score)))
  }

  const generateRecommendations = schedules => {
    const recommendations = []
    const avg = schedules.reduce((s, x) => s + x.efficiencyScore, 0) / schedules.length
    if (avg >= 85)      recommendations.push({ type: 'success', message: ' Excellent schedule! High efficiency across all stops.', action: 'Proceed with this AI-optimized distribution plan.' })
    else if (avg >= 70) recommendations.push({ type: 'good',    message: ' Good schedule with minor optimization opportunities.', action: 'Consider the risk mitigations suggested below.' })
    else                recommendations.push({ type: 'warning', message: ' Schedule has significant challenges.', action: 'Review high-risk stops and consider rescheduling.' })

    const rainyDays = schedules.filter(s => s.weather.weather === 'rainy' || s.weather.weather === 'stormy').length
    if (rainyDays > schedules.length / 2)
      recommendations.push({ type: 'weather', message: 'ðŸŒ§ ' + rainyDays + ' days have rain forecast.', action: 'Consider shifting window or preparing rain contingency.' })

    const highRisk = schedules.filter(s => s.risks.some(r => r.severity === 'high'))
    if (highRisk.length)
      recommendations.push({ type: 'risk', message: ' ' + highRisk.length + ' high-risk stop(s) detected.',
        action: 'Priority attention needed for: ' + highRisk.map(s => s.purok).join(', ') })

    const totalTime = schedules.reduce((s, x) => s + x.routeAnalysis.estimatedTime, 0)
    if (totalTime > 300)
      recommendations.push({ type: 'logistics', message: 'ðŸšš Total distribution time is significant.', action: 'Consider deploying multiple teams or spreading over more days.' })

    return recommendations
  }

  //  Main AI analysis ”
  const handleAnalyze = async () => {
    if (!formData.selectedPuroks.length || !formData.startDate || !formData.endDate || !formData.totalFamilies) {
      alert('Please fill in all required fields.')
      return
    }
    setIsAnalyzing(true)
    await new Promise(r => setTimeout(r, 2500))

    // GPS-aware route: sort puroks by distance from start location
    const startLat = startCoords?.lat ?? DISTRIBUTION_HUB.lat
    const startLng = startCoords?.lng ?? DISTRIBUTION_HUB.lng

    const destinations = formData.selectedPuroks.map(purok => ({
      purok,
      lat: PUROK_DATA[purok].lat,
      lng: PUROK_DATA[purok].lng,
    }))

    const existingSchedules = await foodAidService.getAllFoodAidSchedules().catch(() => [])
    const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 }
    const purokPriorityRank = {}
    existingSchedules.forEach(s => {
      if (!s.purok || !s.priority) return
      const rank = PRIORITY_RANK[s.priority] ?? 2
      if (purokPriorityRank[s.purok] === undefined || rank < purokPriorityRank[s.purok]) {
        purokPriorityRank[s.purok] = rank
      }
    })

    const tiers = [[], [], []]
    destinations.forEach(d => {
      const rank = purokPriorityRank[d.purok] ?? 2
      tiers[rank].push(d)
    })

    let optimizedRoute = []
    let curLat = startLat, curLng = startLng
    tiers.forEach(tierDestinations => {
      if (!tierDestinations.length) return
      const tierRoute = nearestNeighborRoute(curLat, curLng, tierDestinations)
      optimizedRoute = optimizedRoute.concat(tierRoute)
      const last = tierRoute[tierRoute.length - 1]
      curLat = last.lat
      curLng = last.lng
    })

    const totalPopulation = optimizedRoute.reduce((s, d) => s + PUROK_DATA[d.purok].population, 0)

    const schedules = optimizedRoute.map((dest, index) => {
      const date = new Date(formData.startDate)
      date.setDate(date.getDate() + index)
      const dateStr  = date.toISOString().split('T')[0]
      const purok    = dest.purok
      const purokDat = PUROK_DATA[purok]

      const proportionalFamilies = Math.round((purokDat.population / totalPopulation) * parseInt(formData.totalFamilies))
      const weather    = predictWeather(dateStr)
      const optTime    = determineOptimalTime(purok, weather, index)
      const risks      = assessRisks(purok, weather, proportionalFamilies)

      // Calculate distance from GPS start (or previous stop)
      const distFromStart = haversineDistance(startLat, startLng, purokDat.lat, purokDat.lng)
      const travelTime    = estimateTravelTime(dest.distFromPrev ?? distFromStart, purokDat.terrain)

      const routeAnalysis = {
        complexity:    purokDat.terrain === 'hilly' && purokDat.distance > 3 ? 'complex' : purokDat.terrain === 'mixed' || purokDat.distance > 3 ? 'moderate' : 'simple',
        routeDetails:  purokDat.terrain === 'hilly'  ? 'Steep terrain, multiple turns, narrow paths'
                     : purokDat.terrain === 'mixed'  ? 'Mixed terrain, some elevation changes'
                     :                                 'Flat terrain, straightforward path',
        estimatedTime: travelTime,
        distance:      +(dest.distFromPrev ?? distFromStart).toFixed(2),
      }

      const efficiencyScore = calcEfficiency(purok, weather, proportionalFamilies, risks)

      return {
        purok, date: dateStr, stopNumber: index + 1,
        dayName:       date.toLocaleDateString('en-US', { weekday: 'long' }),
        timeSlot:      optTime.timeSlot,
        timeReasoning: optTime.reasoning,
        families:      proportionalFamilies,
        weather, routeAnalysis, risks, efficiencyScore,
        status: efficiencyScore >= 75 ? 'optimal' : efficiencyScore >= 60 ? 'acceptable' : 'challenging',
        lat: purokDat.lat, lng: purokDat.lng,
      }
    })

    const recommendations   = generateRecommendations(schedules)
    const averageEfficiency = Math.floor(schedules.reduce((s, x) => s + x.efficiencyScore, 0) / schedules.length)

    setAnalysisResult({
      schedules, recommendations, averageEfficiency,
      totalDays:     schedules.length,
      totalDistance: schedules.reduce((s, x) => s + x.routeAnalysis.distance, 0).toFixed(1),
      totalTime:     schedules.reduce((s, x) => s + x.routeAnalysis.estimatedTime, 0),
      overallStatus: averageEfficiency >= 80 ? 'excellent' : averageEfficiency >= 65 ? 'good' : 'challenging',
      startLat, startLng,
      startName: startBarangay?.name ?? 'Starting Point',
    })

    setIsAnalyzing(false)
    setShowMap(true)
  }

  // Save to Firestore 
  const handleSaveSchedule = async () => {
    if (!analysisResult) { alert('Analyze first.'); return }
    try {
      await Promise.all(analysisResult.schedules.map(schedule => {
        const weatherInfo = schedule.weather.weather + ' (' + schedule.weather.temperature + '°C, ' + schedule.weather.humidity + '% humidity)'
        const riskSummary = schedule.risks.map(r => r.severity.toUpperCase() + ': ' + r.description).join('; ') || 'No significant risks'
        return foodAidService.createFoodAidSchedule({
          purok: schedule.purok, date: schedule.date, dayName: schedule.dayName,
          timeSlot: schedule.timeSlot, totalFamilies: schedule.families,
          route: schedule.routeAnalysis.routeDetails, routeComplexity: schedule.routeAnalysis.complexity,
          routeDistance: schedule.routeAnalysis.distance, estimatedTime: schedule.routeAnalysis.estimatedTime,
          weatherForecast: weatherInfo, weatherCondition: schedule.weather.weather,
          timeReasoning: schedule.timeReasoning, riskAssessment: riskSummary,
          riskCount: schedule.risks.length, efficiencyScore: schedule.efficiencyScore,
          scheduleStatus: schedule.status, notes: formData.notes || '',
          createdByName: user?.fullName, aiOptimized: true,
          totalScheduleDays: analysisResult.totalDays, overallEfficiency: analysisResult.averageEfficiency,
          gpsStartLat: analysisResult.startLat, gpsStartLng: analysisResult.startLng,
          startBarangay: analysisResult.startName,
          barangayLat: schedule.lat, barangayLng: schedule.lng,
        })
      }))
      alert('Saved ' + analysisResult.schedules.length + ' optimized schedule(s)!\n\nAverage efficiency: ' + analysisResult.averageEfficiency + '%')
      navigate('/food-aid')
    } catch (err) {
      console.error(err)
      alert('Failed to save: ' + err.message)
    }
  }

  //Computed map data 
  const routePositions = analysisResult
    ? [[analysisResult.startLat, analysisResult.startLng], ...analysisResult.schedules.map(s => [s.lat, s.lng])]
    : []

  // Shared styles
  const card = (isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30') + ' backdrop-blur-lg rounded-xl border shadow-lg'
  const inputCls = 'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ' +
    (isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400')

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: 'url(' + toledoImage + ')' }}>
        <div className={'absolute inset-0 ' + (isDarkMode
          ? 'bg-gradient-to-br from-gray-950/95 via-blue-950/95 to-slate-950/95'
          : 'bg-gradient-to-br from-blue-900/85 via-blue-800/85 to-indigo-900/85')} />
      </div>

      <div className="p-4 space-y-4 pb-24">

        {/* Back */}
        <button onClick={() => navigate('/food-aid')}
          className={'flex items-center space-x-2 transition ' + (isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-100 hover:text-white')}>
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Community Assistance</span>
        </button>

        {/* Header */}
        <div className={
          'backdrop-blur-sm rounded-xl p-5 text-white shadow-xl border ' +
          (isDarkMode
            ? 'bg-gradient-to-r from-green-900/90 to-emerald-950/90 border-gray-700/50'
            : 'bg-gradient-to-r from-green-500/90 to-emerald-600/90 border-white/20')
        }>
          <div className="flex items-center space-x-3 mb-1">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">AI-Optimized Distribution Schedule</h2>
          </div>
          <p className={isDarkMode ? 'text-green-200' : 'text-green-100'}>
            GPS-aware route planning  Nearest-neighbour optimization  Risk analysis
          </p>
        </div>

        {/*  GPS Start Location  */}
        <div className={card + ' p-4'}>
          <p className={'text-xs font-bold uppercase tracking-wide mb-3 ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
             Distribution Start Location (GPS)
          </p>

          {gpsStatus === 'idle' || gpsStatus === 'detecting' ? (
            <div className="flex items-center space-x-3">
              <Loader2 className={'w-5 h-5 animate-spin ' + (isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
              <p className={'text-sm ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                {gpsStatus === 'detecting' ? 'Detecting GPS location¦' : 'Initializing¦'}
              </p>
            </div>
          ) : gpsStatus === 'success' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={'w-9 h-9 rounded-xl flex items-center justify-center ' + (isDarkMode ? 'bg-green-900/50' : 'bg-green-50')}>
                  <Navigation className={'w-4 h-4 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={'text-sm font-bold ' + (isDarkMode ? 'text-gray-100' : 'text-gray-900')}>{startBarangay?.name}</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                    GPS detected  {startCoords?.accuracy}m  AI will optimize route from here
                  </p>
                </div>
              </div>
              <button onClick={autoDetectGPS} className={'p-2 rounded-lg ' + (isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className={'w-4 h-4 ' + (isDarkMode ? 'text-orange-400' : 'text-orange-500')} />
                  <p className={'text-sm ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>GPS unavailable “ select start barangay</p>
                </div>
                <button onClick={autoDetectGPS} className={'text-xs px-2.5 py-1.5 rounded-lg font-medium ' + (isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600')}>
                  Retry GPS
                </button>
              </div>
              <select value={manualStart} onChange={e => handleManualStartSelect(e.target.value)} className={inputCls}>
                <option value="">Select your starting barangay</option>
                {TOLEDO_BARANGAYS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/*Form  */}
        <div className={card + ' p-4 space-y-4'}>

          {/* Purok selection */}
          <div>
            <label className={'block text-sm font-medium mb-2 ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              Select Distribution Puroks <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PUROKS.map(purok => (
                <button key={purok} onClick={() => handlePurokToggle(purok)}
                  className={
                    'p-3 rounded-lg border-2 font-medium text-sm transition ' +
                    (formData.selectedPuroks.includes(purok)
                      ? (isDarkMode ? 'bg-green-900/50 border-green-600 text-green-300' : 'bg-green-100 border-green-500 text-green-700')
                      : (isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'))
                  }>
                  <span>{purok}</span>
                  {formData.selectedPuroks.includes(purok) && (
                    <span className={'block text-xs mt-0.5 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')}>
                      ~{PUROK_DATA[purok].distance} km  {PUROK_DATA[purok].terrain}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            {[{ name: 'startDate', label: 'Start Date' }, { name: 'endDate', label: 'End Date' }].map(f => (
              <div key={f.name}>
                <label className={'block text-sm font-medium mb-1.5 ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                  {f.label} <span className="text-red-500">*</span>
                </label>
                <input type="date" name={f.name} value={formData[f.name]} onChange={handleInputChange} className={inputCls} />
              </div>
            ))}
          </div>

          {/* Total families */}
          <div>
            <label className={'block text-sm font-medium mb-1.5 ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              Total Families to Serve <span className="text-red-500">*</span>
            </label>
            <input type="number" name="totalFamilies" value={formData.totalFamilies}
              onChange={handleInputChange} placeholder="e.g. 100" min="1" className={inputCls} />
          </div>

          {/* Notes */}
          <div>
            <label className={'block text-sm font-medium mb-1.5 ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Additional Notes (optional)</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange}
              placeholder="Special considerations or requirements" rows="2"
              className={inputCls + ' resize-none'} />
          </div>

          {/* Analyze button */}
          <button onClick={handleAnalyze} disabled={isAnalyzing}
            className={
              'w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold text-white transition shadow-xl border disabled:opacity-50 disabled:cursor-not-allowed ' +
              (isDarkMode ? 'bg-green-900/90 hover:bg-green-800 border-gray-700/50' : 'bg-green-500/90 hover:bg-green-600 border-white/20')
            }>
            {isAnalyzing
              ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Analyzing with AI</span></>
              : <><Sparkles className="w-5 h-5" /><span>Analyze & Optimize Route</span></>
            }
          </button>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-4">

            {/* Overall status card */}
            <div className={
              'backdrop-blur-lg rounded-xl p-4 border shadow-lg ' +
              (analysisResult.overallStatus === 'excellent'
                ? (isDarkMode ? 'bg-green-950/50 border-green-700/50'  : 'bg-green-50 border-green-300')
                : analysisResult.overallStatus === 'good'
                ? (isDarkMode ? 'bg-blue-950/50 border-blue-700/50'    : 'bg-blue-50 border-blue-300')
                : (isDarkMode ? 'bg-yellow-950/50 border-yellow-700/50' : 'bg-yellow-50 border-yellow-300'))
            }>
              <div className="flex items-center space-x-3">
                {analysisResult.overallStatus === 'excellent'
                  ? <CheckCircle className={'w-6 h-6 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')} />
                  : analysisResult.overallStatus === 'good'
                  ? <TrendingUp  className={'w-6 h-6 ' + (isDarkMode ? 'text-blue-400'  : 'text-blue-600')} />
                  : <AlertTriangle className={'w-6 h-6 ' + (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')} />
                }
                <div>
                  <p className={'font-bold text-lg ' + (isDarkMode ? 'text-gray-100' : 'text-gray-900')}>
                    AI-Optimized Route  {analysisResult.averageEfficiency}% Efficiency
                  </p>
                  <p className={'text-sm ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                    Starting from <strong>{analysisResult.startName}</strong>  {analysisResult.totalDays} stops optimized via GPS
                  </p>
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className={card + ' p-4'}>
              <p className={'text-sm font-bold mb-3 ' + (isDarkMode ? 'text-gray-200' : 'text-gray-800')}> Distribution Summary</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { Icon: Calendar, text: analysisResult.totalDays + ' days' },
                  { Icon: TrendingUp, text: analysisResult.averageEfficiency + '% efficiency' },
                  { Icon: Route,    text: analysisResult.totalDistance + ' km total' },
                  { Icon: Clock,    text: Math.floor(analysisResult.totalTime / 60) + 'h ' + (analysisResult.totalTime % 60) + 'm' },
                ].map(({ Icon, text }) => (
                  <div key={text} className={'flex items-center space-x-2 ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span><strong>{text}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Map */}
            <div className={card + ' overflow-hidden'}>
              <div className={'flex items-center justify-between p-3 border-b ' + (isDarkMode ? 'border-gray-700' : 'border-gray-100')}>
                <div className="flex items-center space-x-2">
                  <Map className={'w-4 h-4 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')} />
                  <span className={'text-sm font-bold ' + (isDarkMode ? 'text-gray-200' : 'text-gray-800')}>AI-Optimized Route Map</span>
                </div>
                <button onClick={() => setShowMap(v => !v)}
                  className={'text-xs px-2.5 py-1 rounded-lg ' + (isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')}>
                  {showMap ? 'Hide' : 'Show'} Map
                </button>
              </div>
              {showMap && (
                <div style={{ height: 360 }}>
                  <MapContainer center={[analysisResult.startLat, analysisResult.startLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <MapFit positions={routePositions} />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {/* Route polyline */}
                    <Polyline positions={routePositions} color="#3b82f6" weight={3} opacity={0.8} dashArray="10 6" />

                    {/* Start marker */}
                    <Marker position={[analysisResult.startLat, analysisResult.startLng]} icon={START_ICON}>
                      <Popup>
                        <div style={{ minWidth: 150 }}>
                          <p style={{ fontWeight: 'bold', marginBottom: 4 }}>ðŸ Start Point</p>
                          <p style={{ fontSize: 12 }}>{analysisResult.startName}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Stop markers */}
                    {analysisResult.schedules.map((s, i) => (
                      <Marker key={s.purok} position={[s.lat, s.lng]} icon={makeStopIcon(i + 1, STOP_COLORS[i % STOP_COLORS.length])}>
                        <Popup>
                          <div style={{ minWidth: 160 }}>
                            <p style={{ fontWeight: 'bold', marginBottom: 4 }}>Stop {i + 1}: {s.purok}</p>
                            <p style={{ fontSize: 12 }}> {s.date}  {s.timeSlot}</p>
                            <p style={{ fontSize: 12 }}> {s.families} families</p>
                            <p style={{ fontSize: 12 }}> {s.routeAnalysis.distance} km from prev stop</p>
                            <div style={{ marginTop: 6, display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                              background: s.status === 'optimal' ? '#10b981' : s.status === 'acceptable' ? '#3b82f6' : '#f59e0b',
                              color: '#fff', fontSize: 11, fontWeight: 700 }}>
                              {s.efficiencyScore}% Efficient
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              )}
              {/* Route legend */}
              <div className={'flex flex-wrap items-center gap-3 p-3 border-t text-xs ' + (isDarkMode ? 'border-gray-700 bg-gray-900/30 text-gray-400' : 'border-gray-100 bg-gray-50/50 text-gray-600')}>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Start Point</span>
                </div>
                {analysisResult.schedules.map((s, i) => (
                  <div key={s.purok} className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: STOP_COLORS[i % STOP_COLORS.length] }} />
                    <span>Stop {i + 1}: {s.purok}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <div className={card + ' p-4'}>
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className={'w-4 h-4 ' + (isDarkMode ? 'text-green-400' : 'text-green-600')} />
                  <p className={'text-sm font-bold ' + (isDarkMode ? 'text-gray-200' : 'text-gray-800')}>AI Recommendations</p>
                </div>
                <div className="space-y-3">
                  {analysisResult.recommendations.map((rec, idx) => (
                    <div key={idx} className={'p-3 rounded-lg ' + (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                      <p className={'text-sm font-medium mb-1 ' + (isDarkMode ? 'text-gray-200' : 'text-gray-800')}>{rec.message}</p>
                      <p className={'text-xs ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>ðŸ’¡ {rec.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Cards */}
            {analysisResult.schedules.map((schedule, index) => (
              <div key={index} className={card + ' p-4'}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: STOP_COLORS[index % STOP_COLORS.length] }}>
                        {index + 1}
                      </div>
                      <h4 className={'font-bold text-lg ' + (isDarkMode ? 'text-gray-100' : 'text-gray-800')}>{schedule.purok}</h4>
                    </div>
                    <div className={'flex items-center space-x-2 text-sm ' + (isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                      <Calendar className="w-4 h-4" />
                      <span>{schedule.dayName}, {schedule.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={
                      'text-xs font-bold px-2.5 py-1 rounded-full ' +
                      (schedule.status === 'optimal'
                        ? (isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700')
                        : schedule.status === 'acceptable'
                        ? (isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700')
                        : (isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'))
                    }>
                      {schedule.efficiencyScore}% Efficient
                    </span>
                    <span className={'text-xs font-semibold px-2 py-0.5 rounded ' + (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')}>
                      {schedule.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Weather + time slot */}
                <div className={'grid grid-cols-2 gap-3 mb-3 p-3 rounded-lg ' + (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      {schedule.weather.weather === 'sunny'
                        ? <Sun className={'w-4 h-4 ' + (isDarkMode ? 'text-yellow-400' : 'text-yellow-500')} />
                        : schedule.weather.weather === 'rainy' || schedule.weather.weather === 'stormy'
                        ? <CloudRain className={'w-4 h-4 ' + (isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                        : <Cloud className={'w-4 h-4 ' + (isDarkMode ? 'text-gray-400' : 'text-gray-500')} />
                      }
                      <span className={'text-sm font-medium capitalize ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                        {schedule.weather.weather.replace('_', ' ')}
                      </span>
                    </div>
                    <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>
                      {schedule.weather.temperature}°C  {schedule.weather.humidity}% humidity
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className={'w-4 h-4 ' + (isDarkMode ? 'text-blue-400' : 'text-blue-500')} />
                      <span className={'text-sm font-medium ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>{schedule.timeSlot}</span>
                    </div>
                    <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-500')}>{schedule.timeReasoning}</p>
                  </div>
                </div>

                {/* Details */}
                <div className={'space-y-2 text-sm mb-3 ' + (isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2"><Users className="w-4 h-4" /><span><strong>{schedule.families}</strong> families</span></div>
                    <span className="text-xs">{PUROK_DATA[schedule.purok].population} residents</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span><strong>{schedule.routeAnalysis.distance} km</strong> from prev stop</span></div>
                    <span className="text-xs">{schedule.routeAnalysis.estimatedTime} min est.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <span><strong>Route:</strong> {schedule.routeAnalysis.routeDetails}</span>
                      <span className={
                        'ml-2 text-xs px-2 py-0.5 rounded ' +
                        (schedule.routeAnalysis.complexity === 'simple'
                          ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                          : schedule.routeAnalysis.complexity === 'moderate'
                          ? (isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                          : (isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'))
                      }>
                        {schedule.routeAnalysis.complexity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risks */}
                {schedule.risks.length > 0 && (
                  <div className={'p-3 rounded-lg ' + (isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-yellow-50 border border-yellow-200')}>
                    <p className={'text-xs font-semibold mb-2 flex items-center space-x-1 ' + (isDarkMode ? 'text-yellow-400' : 'text-yellow-700')}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Risk Assessment ({schedule.risks.length})</span>
                    </p>
                    <div className="space-y-2">
                      {schedule.risks.map((risk, ri) => (
                        <div key={ri} className="text-xs">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={'font-medium ' + (isDarkMode ? 'text-gray-300' : 'text-gray-800')}>{risk.description}</span>
                            <span className={
                              'px-1.5 py-0.5 rounded text-xs font-bold ' +
                              (risk.severity === 'high'   ? (isDarkMode ? 'bg-red-900/50 text-red-400'    : 'bg-red-100 text-red-700')
                             : risk.severity === 'medium' ? (isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                             :                              (isDarkMode ? 'bg-blue-900/50 text-blue-400'   : 'bg-blue-100 text-blue-700'))
                            }>{risk.severity}</span>
                          </div>
                          <p className={'text-xs ' + (isDarkMode ? 'text-gray-500' : 'text-gray-600')}>ðŸ’¡ {risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/food-aid')}
                className={
                  'font-semibold py-3 rounded-xl transition shadow-xl border ' +
                  (isDarkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300' : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700')
                }>
                Cancel
              </button>
              <button onClick={handleSaveSchedule}
                className={
                  'font-semibold py-3 rounded-xl transition shadow-xl border text-white ' +
                  (isDarkMode ? 'bg-green-900/90 hover:bg-green-800 border-gray-700/50' : 'bg-green-500/90 hover:bg-green-600 border-white/20')
                }>
                Save All Schedules
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OptimizeSchedulePage

