
import { useState, useEffect } from 'react'
import { X, Calendar, Clock, FileText, CheckCircle, Loader2, CalendarCheck, AlertTriangle } from 'lucide-react'
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import healthService from '../services/healthService'
import { db } from '../config/firebase'

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

// A request only blocks its slot while it's still "in play" — once a BHW
// rejects it or marks it completed, the slot frees back up for others.
const ACTIVE_STATUSES = ['pending_review', 'scheduled', 'inreview']

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

const ScheduleCheckupModal = ({ isOpen, onClose, symptomsSummary = '', conversation = [] }) => {
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
  const [bookedSlots, setBookedSlots] = useState({})   // { '2026-07-10': Set(['09:00','14:00']) }
  const [slotsLoading, setSlotsLoading] = useState(true)

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

  // Real-time availability: listen to every appointment request in the
  // bookable window so residents see slots fill up / free up live, instead
  // of finding out only after submitting and waiting for BHW review.
  useEffect(() => {
    if (!isOpen) return

    setSlotsLoading(true)
    const q = query(
      collection(db, 'health_requests'),
      where('preferredAppointmentDate', '>=', today),
      where('preferredAppointmentDate', '<=', maxDateStr)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const map = {}
        snapshot.docs.forEach((docSnap) => {
          const req = docSnap.data()
          if (!req.preferredAppointmentDate || !req.preferredAppointmentTime) return
          if (!ACTIVE_STATUSES.includes(req.status)) return
          if (!map[req.preferredAppointmentDate]) map[req.preferredAppointmentDate] = new Set()
          map[req.preferredAppointmentDate].add(req.preferredAppointmentTime)
        })
        setBookedSlots(map)
        setSlotsLoading(false)
      },
      (err) => {
        console.error('Error listening for appointment availability:', err)
        setSlotsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [isOpen, today, maxDateStr])

  const takenTimesForDate = date ? (bookedSlots[date] || new Set()) : new Set()
  const availableTimesForDate = TIME_SLOTS.filter((t) => !takenTimesForDate.has(t))
  const isDateFullyBooked = Boolean(date) && !slotsLoading && availableTimesForDate.length === 0

  // If the picked time gets taken by someone else live, or the date changes,
  // snap to the next open time instead of leaving a taken one selected.
  useEffect(() => {
    if (!date) return
    if (takenTimesForDate.has(time)) {
      setTime(availableTimesForDate[0] || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, bookedSlots])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date) { setError('Please select a date.'); return }
    if (isDateFullyBooked) { setError('This date is fully booked. Please choose another date.'); return }
    if (!time) { setError('Please select an available time.'); return }
    setError('')
    setLoading(true)
    try {
      // Final real-time safety check right before submitting, in case someone
      // else grabbed this exact slot in the moment between picking and submitting.
      const conflictSnap = await getDocs(query(
        collection(db, 'health_requests'),
        where('preferredAppointmentDate', '==', date),
        where('preferredAppointmentTime', '==', time)
      ))
      const stillTaken = conflictSnap.docs.some((d) => ACTIVE_STATUSES.includes(d.data().status))
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
        // Full AI chat history so the BHW can review it in Patient History Logs
        aiConversation: conversation.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
        })),
        message: `AI-recommended barangay checkup on ${date} at ${time}`,
        healthAssessment: {
          vitalsSummary: `Scheduled checkup: ${truncateForSummary(notes)}`,
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
                {TIME_SLOTS.map(t => {
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
                <FileText className="w-3.5 h-3.5" /> Symptoms &amp; AI Analysis
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={6}
                placeholder="Describe your symptoms for the health workerâ€¦"
                className={`${inputCls} resize-y`}
              />
              {symptomsSummary && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${isDarkMode ? 'text-green-500' : 'text-green-600'}`}>
                  <span></span> Pre-filled from your AI health conversation
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || isDateFullyBooked}
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

