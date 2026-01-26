import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Calendar, Users, MapPin, TrendingUp, ArrowLeft, Loader2 } from 'lucide-react'
import toledoImage from '../assets/Toledo.jpg'
import { useTheme } from '../context/ThemeContext'

const PUROKS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5']

const OptimizeSchedulePage = () => {
  const { isDarkMode } = useTheme()
  const navigate = useNavigate()
  
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

  const handleAnalyze = async () => {
    if (formData.selectedPuroks.length === 0 || !formData.startDate || !formData.endDate || !formData.totalFamilies) {
      alert('Please fill in all required fields')
      return
    }

    setIsAnalyzing(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // Generate optimized schedule
    const familiesPerPurok = Math.floor(formData.totalFamilies / formData.selectedPuroks.length)
    const schedules = formData.selectedPuroks.map((purok, index) => {
      const date = new Date(formData.startDate)
      date.setDate(date.getDate() + index)
      
      return {
        purok,
        date: date.toISOString().split('T')[0],
        timeSlot: index % 2 === 0 ? 'Morning (8AM-10AM)' : 'Afternoon (2PM-4PM)',
        families: familiesPerPurok + (index === formData.selectedPuroks.length - 1 ? formData.totalFamilies % formData.selectedPuroks.length : 0),
        route: 'North to South',
        efficiencyScore: Math.floor(85 + Math.random() * 15)
      }
    })
    
    setAnalysisResult({
      schedules,
      totalDays: formData.selectedPuroks.length,
      averageEfficiency: Math.floor(schedules.reduce((acc, s) => acc + s.efficiencyScore, 0) / schedules.length)
    })
    
    setIsAnalyzing(false)
  }

  const handleSaveSchedule = () => {
    // In production, this would save to backend
    alert('Schedule saved successfully!')
    navigate('/food-aid')
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
            {/* Results Header */}
            <div className={`${
              isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
            } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}>
              <h3 className={`font-bold text-lg mb-2 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                Optimized Schedule Results
              </h3>
              <div className={`flex items-center justify-between text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span>Total Days: {analysisResult.totalDays}</span>
                <span>Avg Efficiency: {analysisResult.averageEfficiency}%</span>
              </div>
            </div>

            {/* Schedule Cards */}
            {analysisResult.schedules.map((schedule, index) => (
              <div
                key={index}
                className={`${
                  isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/30'
                } backdrop-blur-lg rounded-lg p-4 border shadow-lg`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className={`font-semibold ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      {schedule.purok}
                    </h4>
                    <div className={`flex items-center space-x-1 mt-1 text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      <span>{schedule.date}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    isDarkMode 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {schedule.efficiencyScore}% efficiency
                  </span>
                </div>

                <div className={`space-y-2 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span><strong>{schedule.families}</strong> families</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-4 h-4 mt-0.5" />
                    <div>
                      <strong>Best time:</strong> {schedule.timeSlot}
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <div>
                      <strong>Route optimization:</strong> {schedule.route}
                    </div>
                  </div>
                </div>
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
