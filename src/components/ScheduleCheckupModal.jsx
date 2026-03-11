import { useState, useEffect } from 'react'
import { X, Calendar, Clock, FileText, CheckCircle, Loader2, CalendarCheck } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import healthService from '../services/healthService'

const ScheduleCheckupModal = ({ isOpen, onClose, symptomsSummary = '' }) => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const [date, setDate]     = useState('')
  const [time, setTime]     = useState('09:00')
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')

  // Sync form state every time the modal opens so the latest
  // AI analysis (passed via symptomsSummary) is always shown.
  useEffect(() => {
    if (isOpen) {
      setNotes(symptomsSummary)
      setDate('')
      setTime('09:00')
      setDone(false)
      setError('')
      setLoading(false)
    }
  }, [isOpen, symptomsSummary])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date) { setError('Please select a date.'); return }
    setError('')
    setLoading(true)
    try {
      await healthService.createHealthRecord({
        type: 'scheduled_checkup',
        scheduledDate: date,
        scheduledTime: time,
        aiSymptomsNotes: notes,
        message: `AI-recommended barangay checkup on ${date} at ${time}`,
        healthAssessment: {
          vitalsSummary: `Scheduled checkup: ${notes.slice(0, 120)}`,
          overallStatus: 'scheduled',
          urgencyLevel: 'routine'
        }
      })
      setDone(true)
    } catch (err) {
      console.error(err)
      setError('Failed to schedule checkup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm ${
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-blue-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-blue-500'
  } focus:outline-none focus:ring-2 focus:border-transparent transition`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-100'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <CalendarCheck className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Schedule Barangay Checkup
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Set a date for your health consultation
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          /* Success state */
          <div className="p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-green-900/40' : 'bg-green-100'}`}>
              <CheckCircle className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <h4 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Checkup Scheduled!
            </h4>
            <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Your barangay health checkup is scheduled for
            </p>
            <p className={`font-semibold text-base mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {new Date(date + 'T' + time).toLocaleString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
                hour: 'numeric', minute: '2-digit'
              })}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              This has been submitted for admin approval. You'll be notified once confirmed.
            </p>
            <button
              onClick={onClose}
              className="mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <p className={`text-sm p-3 rounded-xl ${isDarkMode ? 'bg-red-900/20 text-red-300 border border-red-800/40' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {error}
              </p>
            )}

            {/* Date */}
            <div>
              <label className={`flex items-center gap-1.5 text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Calendar className="w-3.5 h-3.5" /> Preferred Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={today}
                max={maxDateStr}
                className={inputCls}
                required
              />
            </div>

            {/* Time */}
            <div>
              <label className={`flex items-center gap-1.5 text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Clock className="w-3.5 h-3.5" /> Preferred Time
              </label>
              <select value={time} onChange={e => setTime(e.target.value)} className={inputCls}>
                {['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'].map(t => (
                  <option key={t} value={t}>
                    {new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes from AI */}
            <div>
              <label className={`flex items-center gap-1.5 text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <FileText className="w-3.5 h-3.5" /> Symptoms &amp; AI Analysis
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={6}
                placeholder="Describe your symptoms for the health worker…"
                className={`${inputCls} resize-y`}
              />
              {symptomsSummary && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${isDarkMode ? 'text-green-500' : 'text-green-600'}`}>
                  <span>✦</span> Pre-filled from your AI health conversation
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Scheduling…</span></> : <><CalendarCheck className="w-4 h-4" /><span>Confirm Schedule</span></>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ScheduleCheckupModal
