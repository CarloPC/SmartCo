
import { useState, useEffect } from 'react'
import { X, Calendar, Clock, FileText, CheckCircle, Loader2, CalendarCheck, AlertTriangle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import healthService from '../services/healthService'
import appointmentSlotsService from '../services/appointmentSlotsService'

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

// Local (device) calendar date as 'YYYY-MM-DD'. Deliberately NOT
// toISOString() — that converts to UTC first, which can shift the date by
// a day depending on time of day (PH is UTC+8). Residents' devices are
// expected to be set to Philippine time, so reading local Y/M/D directly
// keeps "today" correct without any manual UTC+8 math.
const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// True if the given 'YYYY-MM-DD' + 'HH:MM' slot is already in the past
// relative to `now`. Past days are always past; for today, the slot's
// clock time is compared against the current local time.
const isSlotInPast = (dateStr, timeStr, now = new Date()) => {
  if (!dateStr || !timeStr) return false
  const todayStr = getLocalDateStr(now)
  if (dateStr < todayStr) return true
  if (dateStr > todayStr) return false
  const [hours, minutes] = timeStr.split(':').map(Number)
  const slotMoment = new Date(now)
  slotMoment.setHours(hours, minutes, 0, 0)
  return slotMoment.getTime() <= now.getTime()
}

// Truncates the checkup notes for the dashboard's vitalsSummary preview.
// A blind slice(0, n) can land mid-word (e.g. "AI Health Analysis" -> "AI
// Anal"), so this prefers to drop the trailing "AI Health Analysis:" block
// entirely when it wouldn't fully fit, and otherwise backs off to the last
// whole word before the limit.
const truncateForSummary = (text, maxLen = 140) => {
  if (!text) return ''
  if (text.length <= maxLen) return text

  const analysisMarker = '\n\nAI Health Analysis:'
  const analysisIdx = text.indexOf(analysisMarker)

  // If including the analysis label would cut it off partway, just drop it
  // and summarize the symptoms alone instead.
  const base = analysisIdx !== -1 && analysisIdx <= maxLen
    ? text.slice(0, analysisIdx)
    : text.slice(0, maxLen)

  if (base.length <= maxLen) return `${base.trim()}...`

  const cut = base.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  const safeCut = lastSpace > 40 ? cut.slice(0, lastSpace) : cut
  return `${safeCut.trim()}...`
}

const ScheduleCheckupModal = ({ isOpen, onClose, symptomsSummary = '', conversation = [], aiAnalysisUsed = true }) => {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()

  const today = getLocalDateStr()
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = getLocalDateStr(maxDate)

  const [date, setDate]     = useState('')
  const [time, setTime]     = useState('09:00')
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')
  const [bookedSlots, setBookedSlots] = useState({})   // { '2026-07-10': Set(['09:00','14:00']) }
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [now, setNow] = useState(() => new Date())      // ticks while open so past-time slots update live

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
      setNow(new Date())
    }
  }, [isOpen, symptomsSummary])

  // Keep "now" fresh while the modal is open so a past time slot (e.g. an
  // 8:00 AM slot on the currently-selected today) becomes disabled the
  // moment it passes, without requiring the user to touch the date field.
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(interval)
  }, [isOpen])

  // Real-time availability: listen to every appointment request in the
  // bookable window so residents see slots fill up / free up live, instead
  // of finding out only after submitting and waiting for BHW review.
  useEffect(() => {
    if (!isOpen) return

    setSlotsLoading(true)
    // Reads only the privacy-safe appointmentSlots collection (date/time
    // only) — never queries health_requests directly, so this modal can
    // never pull back another resident's symptoms, AI notes, or name.
    const unsubscribe = appointmentSlotsService.subscribeToBookedRange(today, maxDateStr, (map) => {
      setBookedSlots(map)
      setSlotsLoading(false)
    })

    return () => unsubscribe()
  }, [isOpen, today, maxDateStr])

  const takenTimesForDate = date ? (bookedSlots[date] || new Set()) : new Set()
  const pastTimesForDate = (t) => isSlotInPast(date, t, now)
  const availableTimesForDate = TIME_SLOTS.filter((t) => !takenTimesForDate.has(t) && !pastTimesForDate(t))
  const allSlotsTaken = date ? TIME_SLOTS.every((t) => takenTimesForDate.has(t)) : false
  const allSlotsPast = date ? TIME_SLOTS.every((t) => pastTimesForDate(t)) : false
  const isDateFullyBooked = Boolean(date) && !slotsLoading && availableTimesForDate.length === 0
  const isDateAllPast = isDateFullyBooked && allSlotsPast && !allSlotsTaken

  // If the picked time gets taken by someone else live, becomes past (today's
  // clock catching up to it), or the date changes, snap to the next open
  // time instead of leaving an unavailable one selected.
  useEffect(() => {
    if (!date) return
    if (takenTimesForDate.has(time) || pastTimesForDate(time)) {
      setTime(availableTimesForDate[0] || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, bookedSlots, now])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date) { setError('Please select a date.'); return }
    // Final safety net before any Firestore write — catches past dates AND
    // past times-on-today, even if the UI's disabled state was bypassed.
    if (isSlotInPast(date, time, new Date())) {
      setError('Please select a future date and time for your checkup.')
      return
    }
    if (isDateFullyBooked) {
      setError(
        isDateAllPast
          ? 'All time slots for today have already passed. Please choose another date.'
          : 'This date is fully booked. Please choose another date.'
      )
      return
    }
    if (!time) { setError('Please select an available time.'); return }
    // Direct path has no AI conversation to pre-fill notes, so require a
    // reason here — the AI path already arrives with notes pre-filled.
    if (!aiAnalysisUsed && !notes.trim()) {
      setError('Please provide a reason for your checkup.')
      return
    }
    setError('')
    setLoading(true)
    try {
      // Final real-time safety check right before submitting, in case someone
      // else grabbed this exact slot in the moment between picking and
      // submitting. Checked against the privacy-safe slots collection only.
      const stillTaken = await appointmentSlotsService.isTimeBooked(date, time)
      if (stillTaken) {
        setError('Sorry, that slot was just taken. Please pick another time.')
        setLoading(false)
        return
      }

      await healthService.createHealthRecord({
        type: 'scheduled_checkup',
        userName: user?.fullName,
        userPurok: user?.purok,
        scheduledDate: date,
        scheduledTime: time,
        // These two are what healthService reads into the `health_requests`
        // doc that BHWDashboard subscribes to — must match exactly.
        preferredAppointmentDate: date,
        preferredAppointmentTime: time,
        aiSymptomsNotes: notes,
        // ✅ Optional-AI checkup: only attach AI conversation history when
        // this modal was actually opened from the AI path. The direct path
        // opens this same modal with an empty conversation, so this is
        // already empty there — no fake/placeholder AI data is created.
        aiConversation: aiAnalysisUsed
          ? conversation.map(m => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
            }))
          : [],
        aiAnalysisUsed,
        message: aiAnalysisUsed
          ? `AI-recommended barangay checkup on ${date} at ${time}`
          : `Directly scheduled barangay checkup on ${date} at ${time}`,
        healthAssessment: {
          vitalsSummary: `Scheduled checkup: ${truncateForSummary(notes) || 'No additional notes provided.'}`,
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
                {aiAnalysisUsed ? 'Set a date for your health consultation' : 'Direct schedule — no AI conversation required'}
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
                onChange={e => { setDate(e.target.value); setError('') }}
                min={today}
                max={maxDateStr}
                className={inputCls}
                required
              />
              {date && (
                <p className={`mt-1.5 flex items-center gap-1 text-xs ${
                  isDateFullyBooked
                    ? 'text-red-500'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {slotsLoading ? (
                    'Checking availability…'
                  ) : isDateAllPast ? (
                    <><AlertTriangle className="w-3.5 h-3.5" /> All time slots for today have already passed — please pick another date.</>
                  ) : isDateFullyBooked ? (
                    <><AlertTriangle className="w-3.5 h-3.5" /> Fully booked — please pick another date.</>
                  ) : (
                    `${availableTimesForDate.length} of ${TIME_SLOTS.length} time slots open on this date`
                  )}
                </p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className={`flex items-center gap-1.5 text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Clock className="w-3.5 h-3.5" /> Preferred Time
              </label>
             <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className={inputCls}
                disabled={isDateFullyBooked}
              >
                {TIME_SLOTS
                  .filter(t => !pastTimesForDate(t)) // ✅ past times are removed outright, not just disabled
                  .map(t => {
                  const taken = takenTimesForDate.has(t)
                  return (
                    <option key={t} value={t} disabled={taken}>
                      {new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {taken ? ' — Booked' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Notes from AI */}
            <div>
              <label className={`flex items-center gap-1.5 text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <FileText className="w-3.5 h-3.5" /> {aiAnalysisUsed ? 'Symptoms & AI Analysis' : 'Reason for Checkup'}
                {!aiAnalysisUsed && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); if (error) setError('') }}
                rows={6}
                placeholder={aiAnalysisUsed ? 'Describe your symptoms for the health worker' : "What's the checkup for? (e.g. fever, follow-up, general check-up)"}
                required={!aiAnalysisUsed}
                className={`${inputCls} resize-y`}
              />
              {aiAnalysisUsed && symptomsSummary && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${isDarkMode ? 'text-green-500' : 'text-green-600'}`}>
                  <span></span> Pre-filled from your AI health conversation
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || isDateFullyBooked || (!aiAnalysisUsed && !notes.trim())}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Scheduling</span></> : <><CalendarCheck className="w-4 h-4" /><span>Confirm Schedule</span></>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ScheduleCheckupModal

