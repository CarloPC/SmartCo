import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Calendar, Clock, MapPin, Users, FileText, Tag, TrendingUp, ArrowLeft,
  Loader2, AlertCircle, Sun, CloudRain, Cloud, AlertTriangle, CheckCircle,
  Target, Zap, Star, Brain, Wifi, WifiOff,
} from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useAuth } from '../context/AuthContext'
import eventsService from '../services/eventsService'
import announcementsService from '../services/announcementsService'

const EVENT_CATEGORIES = ['Sports', 'Health', 'Community Service', 'Social', 'Educational']
const DURATION_OPTIONS = ['30 minutes', '1 hour', '2 hours', '3 hours', '4 hours', 'Half day', 'Full day']

// Barangay Ilihan, Toledo City, Cebu — used to pull a real forecast
const TOLEDO_LAT = 10.3762
const TOLEDO_LON = 123.6442

// Real AI narration (Groq) — same client pattern as aiHealthService.js /
// aiInsightsService.js, reusing the same env key so nothing new to configure.
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

// Venue characteristics for suitability scoring
const VENUE_DATA = {
  'Barangay Ilihan Court': { capacity: 200, type: 'outdoor', facilities: ['sports', 'seating', 'lighting'], covered: false },
  'Barangay Ilihan Hall': { capacity: 150, type: 'indoor', facilities: ['chairs', 'stage', 'sound_system', 'AC'], covered: true },
  'Barangay Ilihan Health Center': { capacity: 80, type: 'indoor', facilities: ['chairs', 'medical', 'AC'], covered: true },
  'Community Center': { capacity: 100, type: 'indoor', facilities: ['tables', 'chairs', 'kitchen'], covered: true },
  'Barangay Ilihan Plaza': { capacity: 300, type: 'outdoor', facilities: ['stage', 'seating'], covered: false },
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

// Glass design tokens — synced with EventsPage / HomePage's frosted look.
// One consistent translucent panel is used everywhere instead of the old
// per-element light/dark solid-color branching.
const card = 'rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 shadow-xl backdrop-blur-xl ring-1 ring-white/10'
const inputClass = 'w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition'
const labelClass = 'block text-sm font-medium mb-2 text-white/70'
const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40'

// Status → glass tint (used for overall status, risk severity, priority chips)
const TINTS = {
  excellent: { bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', text: 'text-emerald-300', bar: 'from-emerald-400 to-emerald-500' },
  good:      { bg: 'bg-blue-400/10',    border: 'border-blue-400/30',    text: 'text-blue-300',    bar: 'from-blue-400 to-blue-500' },
  moderate:  { bg: 'bg-amber-400/10',   border: 'border-amber-400/30',   text: 'text-amber-300',   bar: 'from-amber-400 to-amber-500' },
  poor:      { bg: 'bg-red-400/10',     border: 'border-red-400/30',     text: 'text-red-300',     bar: 'from-red-400 to-red-500' },
  critical:  { bg: 'bg-red-400/10',     border: 'border-red-400/30',     text: 'text-red-300' },
  high:      { bg: 'bg-orange-400/10',  border: 'border-orange-400/30',  text: 'text-orange-300' },
  medium:    { bg: 'bg-amber-400/10',   border: 'border-amber-400/30',   text: 'text-amber-300' },
  low:       { bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', text: 'text-emerald-300' },
}

const CreateEventPage = () => {
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
  const [analyzeStep, setAnalyzeStep] = useState('')
  const [aiRecommendation, setAiRecommendation] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // ── Real weather: live forecast (Open-Meteo, no API key needed) for dates
  // within its ~16-day window, falling back to a deterministic Philippine
  // seasonal estimate (never random) outside that window or if offline. ──
  const mapWeatherCode = (code) => {
    if (code === 0) return 'sunny'
    if (code === 1 || code === 2) return 'partly_cloudy'
    if (code === 3 || code === 45 || code === 48) return 'cloudy'
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy'
    if (code >= 95) return 'stormy'
    return 'cloudy'
  }

  const seasonalEstimate = (date) => {
    const month = new Date(date).getMonth() // 0-11
    const isRainySeason = month >= 5 && month <= 10 // Jun–Nov, Philippines
    const weather = isRainySeason ? 'rainy' : 'sunny'
    return {
      weather,
      temperature: isRainySeason ? 27 : 31,
      humidity: isRainySeason ? 82 : 65,
      windSpeed: isRainySeason ? 18 : 11,
      rainfall: isRainySeason ? 6 : 0,
      source: 'seasonal-estimate',
    }
  }

  const fetchWeather = async (date) => {
    try {
      const target = new Date(date)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const diffDays = Math.round((target - today) / 86400000)
      if (diffDays < 0 || diffDays > 15) throw new Error('date outside live forecast window')

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${TOLEDO_LAT}&longitude=${TOLEDO_LON}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_max&timezone=Asia%2FManila&forecast_days=16`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`weather API returned ${res.status}`)
      const data = await res.json()
      const idx = data.daily?.time?.indexOf(date)
      if (idx == null || idx === -1) throw new Error('date not present in forecast payload')

      return {
        weather: mapWeatherCode(data.daily.weathercode[idx]),
        temperature: Math.round((data.daily.temperature_2m_max[idx] + data.daily.temperature_2m_min[idx]) / 2),
        humidity: Math.round(data.daily.relative_humidity_2m_max?.[idx] ?? 75),
        windSpeed: Math.round(data.daily.windspeed_10m_max[idx]),
        rainfall: Math.round(data.daily.precipitation_sum[idx] ?? 0),
        source: 'live-forecast',
      }
    } catch (err) {
      console.warn('[CreateEventPage] Live weather unavailable, using seasonal estimate:', err.message)
      return seasonalEstimate(date)
    }
  }

  // Venue suitability scoring
  const analyzeVenueSuitability = (venue, category, weather, expectedAttendees) => {
    const venueInfo = VENUE_DATA[venue] || { capacity: 100, type: 'outdoor', facilities: [], covered: false }
    const categoryReq = CATEGORY_REQUIREMENTS[category]

    let suitabilityScore = 100
    const issues = []
    const benefits = []

    if (expectedAttendees > venueInfo.capacity) {
      suitabilityScore -= 30
      issues.push({ severity: 'high', message: `Venue capacity (${venueInfo.capacity}) may be insufficient for ${expectedAttendees} attendees`, impact: 'Overcrowding, safety concerns' })
    } else if (expectedAttendees > venueInfo.capacity * 0.8) {
      suitabilityScore -= 15
      issues.push({ severity: 'medium', message: `Near capacity - Limited space for ${expectedAttendees} attendees`, impact: 'Tight seating, limited mobility' })
    } else {
      benefits.push('Adequate space for comfortable attendance')
    }

    if (!venueInfo.covered && (weather.weather === 'rainy' || weather.weather === 'stormy')) {
      suitabilityScore -= 40
      issues.push({ severity: 'high', message: 'Outdoor venue with rain forecast', impact: 'Event cancellation risk, equipment damage' })
    } else if (!venueInfo.covered && weather.temperature > 32) {
      suitabilityScore -= 10
      issues.push({ severity: 'low', message: 'High temperature in outdoor venue', impact: 'Heat discomfort for attendees' })
    } else if (venueInfo.covered) {
      benefits.push('Indoor venue provides weather protection')
    }

    const hasRequiredFacilities = categoryReq.facilities.every(f => venueInfo.facilities.includes(f))
    if (!hasRequiredFacilities) {
      suitabilityScore -= 15
      issues.push({ severity: 'medium', message: `Missing facilities for ${category} event`, impact: 'Limited functionality, may need additional equipment' })
    } else {
      benefits.push('All required facilities available')
    }

    if (categoryReq.idealVenue !== 'any' && categoryReq.idealVenue !== venueInfo.type) {
      suitabilityScore -= 10
      issues.push({ severity: 'low', message: `${venueInfo.type} venue not ideal for ${category}`, impact: 'Suboptimal experience' })
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

  // Attendance prediction
  const predictAttendance = (category, date, time, weather, expectedAttendees) => {
    if (!expectedAttendees) return { predicted: 0, range: [0, 0], confidence: 0, factors: [] }

    let multiplier = 1.0
    const factors = []

    const dayOfWeek = new Date(date).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const [hours] = time.split(':').map(Number)

    if (isWeekend) {
      multiplier *= 1.25
      factors.push({ factor: 'Weekend', impact: '+25%', positive: true })
    } else {
      multiplier *= 0.85
      factors.push({ factor: 'Weekday', impact: '-15%', positive: false })
    }

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

  // Risk assessment
  const assessRisks = (category, date, time, venue, weather, venueAnalysis) => {
    const risks = []

    if (weather.weather === 'stormy') {
      risks.push({ type: 'weather', severity: 'critical', message: 'Storm forecast - High cancellation risk', probability: 85, mitigation: 'Schedule backup date, have indoor alternative ready' })
    } else if (weather.weather === 'rainy' && !venueAnalysis.covered) {
      risks.push({ type: 'weather', severity: 'high', message: 'Rain expected at outdoor venue', probability: 70, mitigation: 'Prepare tents/canopies, have rain contingency plan' })
    }

    if (venueAnalysis.issues.some(i => i.severity === 'high' && i.message.includes('capacity'))) {
      risks.push({ type: 'capacity', severity: 'high', message: 'Insufficient venue capacity', probability: 90, mitigation: 'Limit registrations, consider larger venue, or split into multiple sessions' })
    }

    const [hours] = time.split(':').map(Number)
    const dayOfWeek = new Date(date).getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hours >= 9 && hours <= 17) {
      risks.push({ type: 'timing', severity: 'medium', message: 'Event during typical work hours', probability: 60, mitigation: 'Expect lower turnout, target retirees/students, or reschedule to evening' })
    }

    if (category === 'Sports' && weather.temperature > 33) {
      risks.push({ type: 'health', severity: 'medium', message: 'High temperature for physical activities', probability: 75, mitigation: 'Provide hydration stations, schedule frequent breaks, have first aid ready' })
    }

    if (category === 'Social' && weather.weather === 'rainy') {
      risks.push({ type: 'attendance', severity: 'medium', message: 'Rain may significantly reduce social event turnout', probability: 65, mitigation: 'Send weather updates, confirm attendance day before' })
    }

    if (risks.length === 0) {
      risks.push({ type: 'none', severity: 'low', message: 'No significant risks identified', probability: 10, mitigation: 'Standard event management practices apply' })
    }

    return risks
  }

  // Success probability
  const calculateSuccessProbability = (venueAnalysis, weather, attendancePrediction, risks) => {
    let probability = 100
    probability -= (100 - venueAnalysis.score) * 0.4
    if (weather.weather === 'stormy') probability -= 40
    else if (weather.weather === 'rainy') probability -= 20
    else if (weather.weather === 'partly_cloudy' || weather.weather === 'sunny') probability += 5
    probability += (attendancePrediction.confidence - 75) * 0.3
    const criticalRisks = risks.filter(r => r.severity === 'critical').length
    const highRisks = risks.filter(r => r.severity === 'high').length
    const mediumRisks = risks.filter(r => r.severity === 'medium').length
    probability -= (criticalRisks * 25 + highRisks * 15 + mediumRisks * 8)
    return Math.max(30, Math.min(100, Math.floor(probability)))
  }

  // Rule-based recommendations — always available even if the AI call below fails
  const generateRecommendations = (successProb, venueAnalysis, weather, attendancePrediction) => {
    const recommendations = []

    if (successProb >= 85) {
      recommendations.push({ type: 'success', priority: 'high', message: 'Excellent conditions — event is highly likely to succeed', action: 'Proceed with current plan, ensure standard preparations' })
    } else if (successProb >= 70) {
      recommendations.push({ type: 'good', priority: 'medium', message: 'Good setup with minor considerations', action: 'Address identified issues for optimal outcome' })
    } else if (successProb >= 50) {
      recommendations.push({ type: 'caution', priority: 'high', message: 'Moderate risks present', action: 'Implement mitigation strategies or consider rescheduling' })
    } else {
      recommendations.push({ type: 'warning', priority: 'critical', message: 'High risk of event issues', action: 'Strongly recommend rescheduling or major modifications' })
    }

    if (venueAnalysis.status === 'poor') {
      recommendations.push({ type: 'venue', priority: 'high', message: 'Current venue not suitable', action: venueAnalysis.covered ? 'Consider outdoor venue for better capacity' : 'Switch to covered venue for weather protection' })
    }

    if (weather.weather === 'rainy' || weather.weather === 'stormy') {
      recommendations.push({ type: 'weather', priority: 'high', message: 'Adverse weather forecast', action: 'Reschedule to better weather window or ensure indoor venue' })
    }

    if (attendancePrediction.predicted < attendancePrediction.range[0] * 0.5) {
      recommendations.push({ type: 'attendance', priority: 'medium', message: 'Low predicted turnout', action: 'Increase promotion, send reminders, or reschedule to weekend' })
    }

    return recommendations
  }

  // ── Real AI narration: sends the already-computed, transparent analysis to
  // Groq and asks it only to phrase a verdict — it never invents numbers or
  // makes the decision itself, mirroring aiInsightsService.js's explain(). ──
  const generateAIVerdict = async (payload) => {
    const fallback = {
      verdict: payload.recommendations[0]?.message || 'Analysis complete.',
      narrative: payload.recommendations.map(r => `${r.message}. ${r.action}.`).join(' '),
      source: 'fallback',
    }
    if (!GROQ_API_KEY) return fallback

    for (const model of GROQ_MODELS) {
      try {
        const res = await fetch(GROQ_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are the AI Event Scheduler inside SmartCo, the barangay management system for Barangay ' +
                  'Ilihan, Toledo City, Cebu. You assist Barangay Officials. You NEVER make the final decision — you ' +
                  'only explain the already-computed analysis in clear, practical language for a non-technical reader. ' +
                  'Respond ONLY with a JSON object with exactly two keys: "verdict" (one short headline sentence) and ' +
                  '"narrative" (2-3 sentences covering the most important factors and the single most useful next step). ' +
                  'Do not invent numbers that were not given to you.',
              },
              { role: 'user', content: JSON.stringify(payload) },
            ],
            temperature: 0.3,
            max_tokens: 300,
            response_format: { type: 'json_object' },
          }),
        })
        if (!res.ok) { if (res.status === 429) continue; return fallback }
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (!text) return fallback
        return { ...JSON.parse(text), source: 'groq' }
      } catch (err) {
        console.warn(`[CreateEventPage] Groq model ${model} failed:`, err.message)
        continue
      }
    }
    return fallback
  }

  const handleAnalyze = async () => {
    if (!formData.title || !formData.category || !formData.date || !formData.time || !formData.venue) {
      alert('Please fill in all required fields')
      return
    }

    setIsAnalyzing(true)
    try {
      setAnalyzeStep('Fetching live weather forecast…')
      const weather = await fetchWeather(formData.date)

      setAnalyzeStep('Scoring venue & attendance…')
      const expectedAttendees = parseInt(formData.expectedAttendees) || 50
      const venueAnalysis = analyzeVenueSuitability(formData.venue, formData.category, weather, expectedAttendees)
      const attendancePrediction = predictAttendance(formData.category, formData.date, formData.time, weather, expectedAttendees)
      const risks = assessRisks(formData.category, formData.date, formData.time, formData.venue, weather, venueAnalysis)
      const successProbability = calculateSuccessProbability(venueAnalysis, weather, attendancePrediction, risks)
      const recommendations = generateRecommendations(successProbability, venueAnalysis, weather, attendancePrediction)

      const eventDate = new Date(formData.date)
      const dayOfWeek = eventDate.toLocaleDateString('en-US', { weekday: 'long' })
      const isWeekend = eventDate.getDay() === 0 || eventDate.getDay() === 6
      const overallStatus = successProbability >= 80 ? 'excellent' : successProbability >= 65 ? 'good' : successProbability >= 50 ? 'moderate' : 'poor'

      setAnalyzeStep('Asking AI advisor for a verdict…')
      const aiVerdict = await generateAIVerdict({
        title: formData.title, category: formData.category, dayOfWeek, isWeekend,
        weather, venueAnalysis, attendancePrediction, risks, successProbability, recommendations,
      })

      setAiRecommendation({
        weather, venueAnalysis, attendancePrediction, risks, successProbability,
        recommendations, aiVerdict, dayOfWeek, isWeekend, overallStatus,
      })
    } catch (err) {
      console.error('Event analysis failed:', err)
      alert('Analysis failed. Please check your connection and try again.')
    } finally {
      setIsAnalyzing(false)
      setAnalyzeStep('')
    }
  }

  const handleCreateEvent = async () => {
    try {
      if (!aiRecommendation) {
        alert('Please analyze the event first')
        return
      }

      const weatherInfo = `${aiRecommendation.weather.weather} (${aiRecommendation.weather.temperature}°C, ${aiRecommendation.weather.humidity}% humidity, ${aiRecommendation.weather.windSpeed} km/h wind)`
      const venueSummary = `${aiRecommendation.venueAnalysis.status} (${aiRecommendation.venueAnalysis.score}%) - ${aiRecommendation.venueAnalysis.type}, capacity: ${aiRecommendation.venueAnalysis.capacity}`
      const attendanceSummary = `Predicted: ${aiRecommendation.attendancePrediction.predicted} (${aiRecommendation.attendancePrediction.range[0]}-${aiRecommendation.attendancePrediction.range[1]}) - ${aiRecommendation.attendancePrediction.confidence}% confidence`
      const riskSummary = aiRecommendation.risks.map(r =>
        `${r.severity.toUpperCase()}: ${r.message} (${r.probability}% probability)`
      ).join('; ')
      const recommendationsList = aiRecommendation.recommendations.map(r =>
        `${r.priority.toUpperCase()}: ${r.message} - ${r.action}`
      )

      const eventData = {
        title: formData.title,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        duration: formData.duration || 'Not specified',
        venue: formData.venue,
        expectedAttendees: parseInt(formData.expectedAttendees) || 0,
        description: formData.description || '',

        aiOptimized: true,
        dayOfWeek: aiRecommendation.dayOfWeek,
        isWeekend: aiRecommendation.isWeekend,

        weatherForecast: weatherInfo,
        weatherCondition: aiRecommendation.weather.weather,
        weatherSource: aiRecommendation.weather.source,
        temperature: aiRecommendation.weather.temperature,
        rainfall: aiRecommendation.weather.rainfall,

        venueSuitability: venueSummary,
        venueScore: aiRecommendation.venueAnalysis.score,
        venueStatus: aiRecommendation.venueAnalysis.status,
        venueCovered: aiRecommendation.venueAnalysis.covered,
        venueCapacity: aiRecommendation.venueAnalysis.capacity,

        attendanceAnalysis: attendanceSummary,
        predictedAttendance: aiRecommendation.attendancePrediction.predicted,
        attendanceConfidence: aiRecommendation.attendancePrediction.confidence,
        attendanceMin: aiRecommendation.attendancePrediction.range[0],
        attendanceMax: aiRecommendation.attendancePrediction.range[1],

        riskAssessment: riskSummary,
        riskCount: aiRecommendation.risks.length,
        highRisks: aiRecommendation.risks.filter(r => r.severity === 'high' || r.severity === 'critical').length,

        successProbability: aiRecommendation.successProbability,
        overallStatus: aiRecommendation.overallStatus,

        recommendations: recommendationsList,
        aiVerdict: aiRecommendation.aiVerdict?.verdict || '',
        aiNarrative: aiRecommendation.aiVerdict?.narrative || '',
      }

      console.log('Creating event with data:', { ...eventData, createdBy: '(will be set by service)' })
      const result = await eventsService.createEvent(eventData)
      console.log('Event created successfully:', result)

      try {
        const feedContent = [
          formData.description && formData.description.trim(),
          `📅 Category: ${formData.category}`,
          formData.duration ? `⏱ Duration: ${formData.duration}` : null,
          `👥 Expected attendance: ${aiRecommendation.attendancePrediction.predicted} people (${aiRecommendation.attendancePrediction.confidence}% confidence)`,
          `🤖 AI Success Probability: ${aiRecommendation.successProbability}% — ${aiRecommendation.overallStatus.charAt(0).toUpperCase() + aiRecommendation.overallStatus.slice(1)} conditions`
        ].filter(Boolean).join('\n')

        await announcementsService.createPost({
          title: formData.title,
          content: feedContent,
          type: 'event',
          eventDate: formData.date,
          eventTime: formData.time,
          eventVenue: formData.venue,
          authorName: user?.fullName || 'Official',
          authorRole: user?.role || 'barangay_official'
        })
        console.log('✅ Event mirrored to Barangay Ilihan Board feed')
      } catch (feedErr) {
        console.warn('⚠️ Could not mirror event to feed:', feedErr.message)
      }

      alert(`✅ Event created successfully!\n\nSuccess Probability: ${aiRecommendation.successProbability}%\nPredicted Attendance: ${aiRecommendation.attendancePrediction.predicted} people`)
      navigate('/events')
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.\n\nError: ' + error.message)
    }
  }

  const overallTint = aiRecommendation ? TINTS[aiRecommendation.overallStatus] : null

  return (
    <div className="min-h-screen relative">
      {/* Background — matches EventsPage's hero shell */}
      <div className="fixed inset-0 bg-cover bg-center -z-10" style={{ backgroundImage: `url(${toledoImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-indigo-950/95" />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl p-4 space-y-4 pb-24 sm:p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Events</span>
        </button>

        {/* Header */}
        <div className={`${card} bg-gradient-to-r from-violet-500/30 via-purple-500/20 to-fuchsia-500/30 p-6 text-white`}>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">Create New Event</h2>
          </div>
          <p className="text-white/70">AI-Optimized Event Scheduling</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70">
            <Brain className="h-3 w-3" /> Live weather + Groq-explained analysis
          </div>
        </div>

        {/* Form Section */}
        <div className={`${card} p-4 sm:p-5 space-y-4`}>
          <div>
            <label className={labelClass}>Event Title <span className="text-red-300">*</span></label>
            <input
              type="text" name="title" value={formData.title} onChange={handleInputChange}
              placeholder="e.g., Basketball Tournament 2026" className={inputClass.replace('pl-10', 'pl-3.5')}
            />
          </div>

          <div>
            <label className={labelClass}>Event Category <span className="text-red-300">*</span></label>
            <div className="relative">
              <Tag className={iconClass} />
              <select name="category" value={formData.category} onChange={handleInputChange} className={inputClass}>
                <option value="" className="bg-slate-800">Select category...</option>
                {EVENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-800">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Event Date <span className="text-red-300">*</span></label>
              <div className="relative">
                <Calendar className={iconClass} />
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={`${inputClass} [color-scheme:dark]`} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Event Time <span className="text-red-300">*</span></label>
              <div className="relative">
                <Clock className={iconClass} />
                <input type="time" name="time" value={formData.time} onChange={handleInputChange} className={`${inputClass} [color-scheme:dark]`} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Duration</label>
            <div className="relative">
              <Clock className={iconClass} />
              <select name="duration" value={formData.duration} onChange={handleInputChange} className={inputClass}>
                <option value="" className="bg-slate-800">Select duration...</option>
                {DURATION_OPTIONS.map(dur => (
                  <option key={dur} value={dur} className="bg-slate-800">{dur}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Venue/Location <span className="text-red-300">*</span></label>
            <div className="relative">
              <MapPin className={iconClass} />
              <input
                type="text" name="venue" value={formData.venue} onChange={handleInputChange}
                placeholder="e.g., Barangay Ilihan Court" className={inputClass}
                list="venue-suggestions"
              />
              <datalist id="venue-suggestions">
                {Object.keys(VENUE_DATA).map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className={labelClass}>Expected Attendees</label>
            <div className="relative">
              <Users className={iconClass} />
              <input
                type="number" name="expectedAttendees" value={formData.expectedAttendees} onChange={handleInputChange}
                placeholder="e.g., 50" min="1" className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Event Description</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-white/40" />
              <textarea
                name="description" value={formData.description} onChange={handleInputChange}
                placeholder="Provide details about the event..." rows="3"
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{analyzeStep || 'Analyzing…'}</span>
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
            <div className={`${card} ${overallTint.bg} border ${overallTint.border} p-4`}>
              <div className="flex items-start gap-3">
                {aiRecommendation.overallStatus === 'excellent' ? <CheckCircle className={`w-6 h-6 ${overallTint.text}`} />
                  : aiRecommendation.overallStatus === 'good' ? <TrendingUp className={`w-6 h-6 ${overallTint.text}`} />
                  : aiRecommendation.overallStatus === 'moderate' ? <AlertCircle className={`w-6 h-6 ${overallTint.text}`} />
                  : <AlertTriangle className={`w-6 h-6 ${overallTint.text}`} />}
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-1 ${overallTint.text}`}>AI Event Analysis Complete</h3>
                  <p className="text-sm text-white/70">
                    {aiRecommendation.dayOfWeek}, {formData.date} • {aiRecommendation.isWeekend ? 'Weekend Event' : 'Weekday Event'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Advisor Verdict — Groq-generated narrative over the computed analysis */}
            <div className={`${card} p-4`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                <Brain className="w-5 h-5 text-violet-300" />
                <span>AI Advisor</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                  {aiRecommendation.aiVerdict.source === 'groq'
                    ? <><Wifi className="h-2.5 w-2.5" /> Groq Llama 3.3</>
                    : <><WifiOff className="h-2.5 w-2.5" /> Rule-based (no AI key configured)</>}
                </span>
              </h4>
              <p className="text-sm font-semibold text-white mb-1">{aiRecommendation.aiVerdict.verdict}</p>
              <p className="text-sm text-white/70">{aiRecommendation.aiVerdict.narrative}</p>
            </div>

            {/* Success Probability */}
            <div className={`${card} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-300" />
                  <span className="text-sm font-semibold text-white/80">Event Success Probability</span>
                </div>
                <span className={`text-2xl font-bold ${TINTS[aiRecommendation.successProbability >= 80 ? 'excellent' : aiRecommendation.successProbability >= 65 ? 'good' : aiRecommendation.successProbability >= 50 ? 'moderate' : 'poor'].text}`}>
                  {aiRecommendation.successProbability}%
                </span>
              </div>
              <div className="w-full rounded-full h-4 bg-white/10">
                <div
                  className={`bg-gradient-to-r ${TINTS[aiRecommendation.successProbability >= 80 ? 'excellent' : aiRecommendation.successProbability >= 65 ? 'good' : aiRecommendation.successProbability >= 50 ? 'moderate' : 'poor'].bar} h-4 rounded-full transition-all flex items-center justify-end pr-2`}
                  style={{ width: `${aiRecommendation.successProbability}%` }}
                >
                  <Star className="w-3 h-3 text-white" />
                </div>
              </div>
              <p className="text-xs mt-2 text-white/50">
                Based on weather, venue suitability, attendance prediction, and risk factors
              </p>
            </div>

            {/* Weather Forecast Card */}
            <div className={`${card} p-4`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                {aiRecommendation.weather.weather === 'sunny' ? <Sun className="w-5 h-5 text-yellow-300" />
                  : (aiRecommendation.weather.weather === 'rainy' || aiRecommendation.weather.weather === 'stormy') ? <CloudRain className="w-5 h-5 text-blue-300" />
                  : <Cloud className="w-5 h-5 text-white/60" />}
                <span>Weather Forecast</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                  {aiRecommendation.weather.source === 'live-forecast' ? 'Live forecast' : 'Seasonal estimate'}
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/50 mb-1">Condition</p>
                  <p className="font-semibold text-white">
                    {aiRecommendation.weather.weather.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Temperature</p>
                  <p className="font-semibold text-white">{aiRecommendation.weather.temperature}°C</p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Wind Speed</p>
                  <p className="font-semibold text-white">{aiRecommendation.weather.windSpeed} km/h</p>
                </div>
                <div>
                  <p className="text-white/50 mb-1">Humidity</p>
                  <p className="font-semibold text-white">{aiRecommendation.weather.humidity}%</p>
                </div>
              </div>
              {aiRecommendation.weather.rainfall > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-blue-400/10 border border-blue-400/20">
                  <p className="text-xs text-blue-200">⚠️ Expected rainfall: {aiRecommendation.weather.rainfall}mm</p>
                </div>
              )}
            </div>

            {/* Venue Suitability */}
            <div className={`${card} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2 text-white">
                  <MapPin className="w-5 h-5" />
                  <span>Venue Suitability Analysis</span>
                </h4>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${TINTS[aiRecommendation.venueAnalysis.status === 'acceptable' ? 'moderate' : aiRecommendation.venueAnalysis.status].bg} ${TINTS[aiRecommendation.venueAnalysis.status === 'acceptable' ? 'moderate' : aiRecommendation.venueAnalysis.status].text}`}>
                  {aiRecommendation.venueAnalysis.score}% Match
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50">Type</p>
                  <p className="font-semibold text-white capitalize">{aiRecommendation.venueAnalysis.type}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50">Capacity</p>
                  <p className="font-semibold text-white">{aiRecommendation.venueAnalysis.capacity}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50">Coverage</p>
                  <p className="font-semibold text-white">{aiRecommendation.venueAnalysis.covered ? 'Indoor' : 'Outdoor'}</p>
                </div>
              </div>

              {aiRecommendation.venueAnalysis.benefits.length > 0 && (
                <div className="mb-3 p-3 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
                  <p className="text-xs font-semibold mb-2 text-emerald-300">✅ Advantages</p>
                  {aiRecommendation.venueAnalysis.benefits.map((benefit, idx) => (
                    <p key={idx} className="text-xs text-emerald-200/80">• {benefit}</p>
                  ))}
                </div>
              )}

              {aiRecommendation.venueAnalysis.issues.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-400/10 border border-amber-400/20">
                  <p className="text-xs font-semibold mb-2 text-amber-300">⚠️ Considerations</p>
                  {aiRecommendation.venueAnalysis.issues.map((issue, idx) => (
                    <div key={idx} className="mb-2 last:mb-0">
                      <p className="text-xs font-medium text-amber-200">{issue.message}</p>
                      <p className="text-xs text-amber-300/70">Impact: {issue.impact}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance Prediction */}
            <div className={`${card} p-4`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                <Users className="w-5 h-5" />
                <span>Attendance Prediction</span>
              </h4>

              <div className="p-4 rounded-lg mb-3 bg-purple-400/10 border border-purple-400/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Expected</span>
                  <span className="text-2xl font-bold text-purple-300">
                    {aiRecommendation.attendancePrediction.predicted}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">
                    Range: {aiRecommendation.attendancePrediction.range[0]}-{aiRecommendation.attendancePrediction.range[1]}
                  </span>
                  <span className="font-semibold text-purple-300">
                    {aiRecommendation.attendancePrediction.confidence}% confidence
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/50">Influencing Factors:</p>
                {aiRecommendation.attendancePrediction.factors.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/10">
                    <span className="text-white/70">{factor.factor}</span>
                    <span className={`font-bold ${factor.positive ? 'text-emerald-300' : 'text-red-300'}`}>
                      {factor.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className={`${card} p-4`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                <AlertTriangle className="w-5 h-5" />
                <span>Risk Assessment ({aiRecommendation.risks.length})</span>
              </h4>

              {aiRecommendation.risks.map((risk, idx) => {
                const t = TINTS[risk.severity] || TINTS.low
                return (
                  <div key={idx} className={`mb-3 last:mb-0 p-3 rounded-lg border ${t.bg} ${t.border}`}>
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <p className={`text-sm font-semibold ${t.text}`}>{risk.message}</p>
                      <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${t.bg} ${t.text}`}>
                        {risk.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs mb-2 text-white/50">Probability: {risk.probability}%</p>
                    <div className="p-2 rounded bg-white/5">
                      <p className="text-xs text-white/70">
                        💡 <strong>Mitigation:</strong> {risk.mitigation}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Recommendations */}
            <div className={`${card} p-4`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5" />
                <span>Recommendations</span>
              </h4>

              <div className="space-y-3">
                {aiRecommendation.recommendations.map((rec, idx) => {
                  const t = TINTS[rec.priority] || TINTS.medium
                  return (
                    <div key={idx} className={`p-3 rounded-lg border ${t.bg} ${t.border}`}>
                      <div className="flex items-start gap-2">
                        <Zap className={`w-4 h-4 mt-0.5 ${t.text}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1 text-white">{rec.message}</p>
                          <p className="text-xs text-white/60">→ {rec.action}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/events')}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 backdrop-blur-sm font-semibold py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold py-3 rounded-xl transition shadow-lg"
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