import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Heart, Activity, Thermometer, Scale, Droplets, FileText, TrendingUp, ArrowLeft, Loader2, AlertCircle, CheckCircle, Calendar } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import healthService from '../services/healthService'

const RecordCheckupPage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    heartRate: '',
    weight: '',
    oxygenSaturation: '',
    symptoms: '',
    painLevel: 0
  })
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [healthAssessment, setHealthAssessment] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const analyzeVitals = () => {
    const vitalsDetails = []
    let concerningVitals = 0
    let criticalVitals = 0
    
    // Blood Pressure Analysis
    const systolic = parseInt(formData.bloodPressureSystolic)
    const diastolic = parseInt(formData.bloodPressureDiastolic)
    
    if (systolic && diastolic) {
      if (systolic >= 180 || diastolic >= 120) {
        vitalsDetails.push({
          metric: 'Blood Pressure',
          value: `${systolic}/${diastolic} mmHg`,
          status: 'high',
          range: 'Normal: <120/<80'
        })
        criticalVitals++
      } else if (systolic >= 140 || diastolic >= 90) {
        vitalsDetails.push({
          metric: 'Blood Pressure',
          value: `${systolic}/${diastolic} mmHg`,
          status: 'elevated',
          range: 'Normal: <120/<80'
        })
        concerningVitals++
      } else if (systolic < 90 || diastolic < 60) {
        vitalsDetails.push({
          metric: 'Blood Pressure',
          value: `${systolic}/${diastolic} mmHg`,
          status: 'low',
          range: 'Normal: <120/<80'
        })
        concerningVitals++
      } else {
        vitalsDetails.push({
          metric: 'Blood Pressure',
          value: `${systolic}/${diastolic} mmHg`,
          status: 'normal',
          range: 'Normal: <120/<80'
        })
      }
    }
    
    // Temperature Analysis
    const temp = parseFloat(formData.temperature)
    if (temp) {
      if (temp >= 38.5) {
        vitalsDetails.push({
          metric: 'Temperature',
          value: `${temp}°C`,
          status: 'high',
          range: 'Normal: 36.5-37.5°C'
        })
        concerningVitals++
      } else if (temp < 36) {
        vitalsDetails.push({
          metric: 'Temperature',
          value: `${temp}°C`,
          status: 'low',
          range: 'Normal: 36.5-37.5°C'
        })
        concerningVitals++
      } else {
        vitalsDetails.push({
          metric: 'Temperature',
          value: `${temp}°C`,
          status: 'normal',
          range: 'Normal: 36.5-37.5°C'
        })
      }
    }
    
    // Heart Rate Analysis
    const heartRate = parseInt(formData.heartRate)
    if (heartRate) {
      if (heartRate > 100) {
        vitalsDetails.push({
          metric: 'Heart Rate',
          value: `${heartRate} bpm`,
          status: 'high',
          range: 'Normal: 60-100 bpm'
        })
        concerningVitals++
      } else if (heartRate < 60) {
        vitalsDetails.push({
          metric: 'Heart Rate',
          value: `${heartRate} bpm`,
          status: 'low',
          range: 'Normal: 60-100 bpm'
        })
        concerningVitals++
      } else {
        vitalsDetails.push({
          metric: 'Heart Rate',
          value: `${heartRate} bpm`,
          status: 'normal',
          range: 'Normal: 60-100 bpm'
        })
      }
    }
    
    // Oxygen Saturation Analysis
    const oxygen = parseInt(formData.oxygenSaturation)
    if (oxygen) {
      if (oxygen < 90) {
        vitalsDetails.push({
          metric: 'Oxygen Saturation',
          value: `${oxygen}%`,
          status: 'low',
          range: 'Normal: >95%'
        })
        criticalVitals++
      } else if (oxygen < 95) {
        vitalsDetails.push({
          metric: 'Oxygen Saturation',
          value: `${oxygen}%`,
          status: 'elevated',
          range: 'Normal: >95%'
        })
        concerningVitals++
      } else {
        vitalsDetails.push({
          metric: 'Oxygen Saturation',
          value: `${oxygen}%`,
          status: 'normal',
          range: 'Normal: >95%'
        })
      }
    }
    
    return { vitalsDetails, concerningVitals, criticalVitals }
  }

  const generateRecommendations = (overallStatus, requiresAppointment, hasSymptoms) => {
    const recommendations = []
    
    if (overallStatus === 'critical') {
      recommendations.push('⚠️ Urgent: Seek immediate medical attention at the Barangay Health Center')
      recommendations.push('Your vital signs indicate a potentially serious condition')
      recommendations.push('Do not delay - visit us immediately or call emergency services')
    } else if (overallStatus === 'concerning') {
      recommendations.push('Please schedule an appointment at the Barangay Health Center within the next few days')
      recommendations.push('Continue monitoring your vital signs daily')
      if (hasSymptoms) {
        recommendations.push('Keep track of your symptoms and their progression')
      }
    } else {
      recommendations.push('Your vital signs are looking good!')
      recommendations.push('Continue maintaining your healthy lifestyle')
      recommendations.push('Schedule a routine checkup in 3-6 months')
    }
    
    return recommendations
  }

  const generateHealthTips = (overallStatus, vitalsDetails) => {
    const tips = []
    
    if (overallStatus === 'good') {
      tips.push('💧 Stay hydrated - drink at least 8 glasses of water daily')
      tips.push('🥗 Maintain a balanced diet rich in fruits and vegetables')
      tips.push('🏃 Regular exercise for at least 30 minutes daily')
      tips.push('😴 Get 7-8 hours of quality sleep each night')
      tips.push('🧘 Practice stress management through meditation or relaxation')
    } else {
      // Check for specific conditions
      const hasBPIssue = vitalsDetails.some(v => v.metric === 'Blood Pressure' && v.status !== 'normal')
      const hasTempIssue = vitalsDetails.some(v => v.metric === 'Temperature' && v.status !== 'normal')
      
      if (hasBPIssue) {
        tips.push('🧂 Reduce salt intake in your diet')
        tips.push('🏃 Engage in regular moderate exercise')
        tips.push('😌 Manage stress through relaxation techniques')
      }
      
      if (hasTempIssue) {
        tips.push('💧 Increase fluid intake to stay hydrated')
        tips.push('😴 Get plenty of rest')
        tips.push('🌡️ Monitor your temperature regularly')
      }
      
      tips.push('📊 Keep a daily log of your vital signs')
      tips.push('💊 Take medications as prescribed')
    }
    
    return tips
  }

  const handleAnalyze = async () => {
    if (!formData.bloodPressureSystolic || !formData.bloodPressureDiastolic || 
        !formData.temperature || !formData.heartRate) {
      alert('Please fill in all required vital signs')
      return
    }

    setIsAnalyzing(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const { vitalsDetails, concerningVitals, criticalVitals } = analyzeVitals()
    
    // Determine overall status
    let overallStatus = 'good'
    let requiresAppointment = false
    let urgencyLevel = 'routine'
    
    if (criticalVitals > 0 || formData.painLevel >= 8) {
      overallStatus = 'critical'
      requiresAppointment = true
      urgencyLevel = 'urgent'
    } else if (concerningVitals > 0 || formData.painLevel >= 5 || formData.symptoms.length > 10) {
      overallStatus = 'concerning'
      requiresAppointment = true
      urgencyLevel = 'soon'
    }
    
    const hasSymptoms = formData.symptoms.trim().length > 0
    
    setHealthAssessment({
      overallStatus,
      vitalsSummary: overallStatus === 'good' 
        ? 'All vitals are within normal range - Keep up the great work!' 
        : overallStatus === 'concerning'
          ? 'Some vitals need monitoring - Please schedule a checkup'
          : 'Immediate attention required - Visit the health center now',
      vitalsDetails,
      recommendations: generateRecommendations(overallStatus, requiresAppointment, hasSymptoms),
      healthTips: generateHealthTips(overallStatus, vitalsDetails),
      requiresAppointment,
      urgencyLevel
    })
    
    setIsAnalyzing(false)
  }

  const handleSaveCheckup = async () => {
    try {
      // Save the health record with all the data
      // Don't pass userId - the service will add it from auth.currentUser
      const recordData = {
        userName: user?.fullName,
        userPurok: user?.purok,
        formData,
        healthAssessment,
        recordedBy: user?.fullName
      }

      console.log('Saving health record with data:', recordData)
      const result = await healthService.createHealthRecord(recordData)
      console.log('Health record saved successfully:', result)
      
      alert('Health checkup record saved successfully!')
      navigate('/health')
    } catch (error) {
      console.error('Error saving health record:', error)
      alert('Failed to save health record. Please try again.')
    }
  }

  const handleScheduleAppointment = () => {
    alert('Appointment request sent! Our health worker will contact you shortly.')
    navigate('/health')
  }

  const getStatusColor = (status) => {
    if (status === 'good') {
      return isDarkMode ? 'text-green-400' : 'text-green-600'
    } else if (status === 'concerning') {
      return isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
    } else {
      return isDarkMode ? 'text-red-400' : 'text-red-600'
    }
  }

  const getStatusBg = (status) => {
    if (status === 'good') {
      return isDarkMode ? 'bg-green-950/50 border-green-700/50' : 'bg-green-50 border-green-300'
    } else if (status === 'concerning') {
      return isDarkMode ? 'bg-yellow-950/50 border-yellow-700/50' : 'bg-yellow-50 border-yellow-300'
    } else {
      return isDarkMode ? 'bg-red-950/50 border-red-700/50' : 'bg-red-50 border-red-300'
    }
  }

  const getVitalStatusColor = (status) => {
    switch(status) {
      case 'normal': return isDarkMode ? 'text-green-400' : 'text-green-600'
      case 'elevated': return isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
      case 'high': return isDarkMode ? 'text-red-400' : 'text-red-600'
      case 'low': return isDarkMode ? 'text-blue-400' : 'text-blue-600'
      default: return isDarkMode ? 'text-gray-400' : 'text-gray-600'
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
          onClick={() => navigate('/health')}
          className={`flex items-center space-x-2 ${
            isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-100 hover:text-white'
          } transition`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Health</span>
        </button>

        {/* Header */}
        <div className={`${
          isDarkMode 
            ? 'bg-gradient-to-r from-red-900/90 to-rose-950/90 border-gray-700/50' 
            : 'bg-gradient-to-r from-red-500/90 to-rose-600/90 border-white/20'
        } backdrop-blur-sm rounded-xl p-6 text-white shadow-xl border`}>
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">Record Health Checkup</h2>
          </div>
          <p className={isDarkMode ? 'text-red-200' : 'text-red-100'}>
            AI Health Assistant
          </p>
        </div>

        {/* Form Section */}
        <div className={`${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
        } backdrop-blur-lg rounded-lg p-4 border shadow-lg space-y-4`}>
          
          {/* Blood Pressure */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Blood Pressure <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Activity className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="number"
                  name="bloodPressureSystolic"
                  value={formData.bloodPressureSystolic}
                  onChange={handleInputChange}
                  placeholder="Systolic"
                  min="0"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>mmHg</span>
              </div>
              <div className="relative">
                <Activity className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="number"
                  name="bloodPressureDiastolic"
                  value={formData.bloodPressureDiastolic}
                  onChange={handleInputChange}
                  placeholder="Diastolic"
                  min="0"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>mmHg</span>
              </div>
            </div>
          </div>

          {/* Temperature and Heart Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Temperature <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Thermometer className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  placeholder="36.5"
                  step="0.1"
                  min="0"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>°C</span>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Heart Rate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Heart className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="number"
                  name="heartRate"
                  value={formData.heartRate}
                  onChange={handleInputChange}
                  placeholder="72"
                  min="0"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>bpm</span>
              </div>
            </div>
          </div>

          {/* Weight and Oxygen */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Weight
              </label>
              <div className="relative">
                <Scale className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="65"
                  step="0.1"
                  min="0"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>kg</span>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Oxygen Level
              </label>
              <div className="relative">
                <Droplets className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="number"
                  name="oxygenSaturation"
                  value={formData.oxygenSaturation}
                  onChange={handleInputChange}
                  placeholder="98"
                  min="0"
                  max="100"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>%</span>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Current Symptoms
            </label>
            <div className="relative">
              <FileText className={`absolute left-3 top-3 w-4 h-4 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                placeholder="Describe any symptoms you're experiencing..."
                rows="3"
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500 resize-none`}
              />
            </div>
          </div>

          {/* Pain Level */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Pain Level: <span className={`font-bold ${
                formData.painLevel >= 7 ? 'text-red-500' : formData.painLevel >= 4 ? 'text-yellow-500' : 'text-green-500'
              }`}>{formData.painLevel}</span>
            </label>
            <input
              type="range"
              name="painLevel"
              value={formData.painLevel}
              onChange={handleInputChange}
              min="0"
              max="10"
              className="w-full"
            />
            <div className={`flex justify-between text-xs mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span>No Pain</span>
              <span>Severe Pain</span>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full ${
              isDarkMode 
                ? 'bg-red-900/90 hover:bg-red-800 border-gray-700/50' 
                : 'bg-red-500/90 hover:bg-red-600 border-white/20'
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
                <span>Analyze Health</span>
              </>
            )}
          </button>
        </div>

        {/* Health Assessment Results */}
        {healthAssessment && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className={`${getStatusBg(healthAssessment.overallStatus)} backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <div className="flex items-start space-x-3">
                {healthAssessment.overallStatus === 'good' ? (
                  <CheckCircle className={`w-6 h-6 ${getStatusColor(healthAssessment.overallStatus)}`} />
                ) : (
                  <AlertCircle className={`w-6 h-6 ${getStatusColor(healthAssessment.overallStatus)}`} />
                )}
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-1 ${getStatusColor(healthAssessment.overallStatus)}`}>
                    Health Assessment Results
                  </h3>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {healthAssessment.vitalsSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Vitals Details */}
            {healthAssessment.vitalsDetails.length > 0 && (
              <div className={`${
                isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
              } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
                <h4 className={`font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Vital Signs Summary
                </h4>
                <div className="space-y-3">
                  {healthAssessment.vitalsDetails.map((vital, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {vital.metric}
                        </p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {vital.range}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getVitalStatusColor(vital.status)}`}>
                          {vital.value}
                        </p>
                        <p className={`text-xs capitalize ${getVitalStatusColor(vital.status)}`}>
                          {vital.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h4 className={`font-semibold mb-3 flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                <Sparkles className="w-5 h-5" />
                <span>Personalized Recommendations</span>
              </h4>
              <div className="space-y-2">
                {healthAssessment.recommendations.map((rec, idx) => (
                  <p key={idx} className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {rec}
                  </p>
                ))}
              </div>
            </div>

            {/* Health Tips */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h4 className={`font-semibold mb-3 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                💡 Health Tips
              </h4>
              <div className="space-y-2">
                {healthAssessment.healthTips.map((tip, idx) => (
                  <p key={idx} className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {tip}
                  </p>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={healthAssessment.requiresAppointment ? "grid grid-cols-2 gap-3" : ""}>
              {healthAssessment.requiresAppointment && (
                <button
                  onClick={handleScheduleAppointment}
                  className={`${
                    healthAssessment.urgencyLevel === 'urgent'
                      ? isDarkMode 
                        ? 'bg-red-900/90 hover:bg-red-800 border-red-700/50 animate-pulse' 
                        : 'bg-red-500/90 hover:bg-red-600 border-red-300 animate-pulse'
                      : isDarkMode 
                        ? 'bg-blue-900/90 hover:bg-blue-800 border-gray-700/50' 
                        : 'bg-blue-500/90 hover:bg-blue-600 border-white/20'
                  } backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition shadow-xl border flex items-center justify-center space-x-2`}
                >
                  <Calendar className="w-5 h-5" />
                  <span>Schedule Appointment</span>
                </button>
              )}
              <button
                onClick={handleSaveCheckup}
                className={`${
                  isDarkMode 
                    ? 'bg-green-900/90 hover:bg-green-800 border-gray-700/50' 
                    : 'bg-green-500/90 hover:bg-green-600 border-white/20'
                } backdrop-blur-sm text-white font-semibold py-3 rounded-xl transition shadow-xl border`}
              >
                Save Checkup Record
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecordCheckupPage
