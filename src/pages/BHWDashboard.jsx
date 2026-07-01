
import FoodAidProjectionChart from '../components/FoodAidProjectionChart'
import EventAttendanceChart from '../components/EventAttendanceChart'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Search, Stethoscope, Sparkles, Clock3, UserRound, MapPin, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  subscribeToPendingRequests,
  subscribeToProcessedRequests,
  subscribeToHealthRequestAnalytics,
  updateHealthRequestStatus,
} from '../services/bhwService'
import { sendHealthMessage } from '../services/aiHealthService'

const BHWDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDarkMode } = useTheme()

  const [pendingRequests, setPendingRequests] = useState([])
  const [processedRequests, setProcessedRequests] = useState([])
  const [analyticsData, setAnalyticsData] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [scheduleError, setScheduleError] = useState('')
  const [triageSummary, setTriageSummary] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.role !== 'bhw') {
      navigate('/home', { replace: true })
      return
    }

    const unsubscribePending = subscribeToPendingRequests((requests) => {
      setPendingRequests(requests)
      setLoading(false)
    })

    const unsubscribeProcessed = subscribeToProcessedRequests((requests) => {
      setProcessedRequests(requests)
    })

    const unsubscribeAnalytics = subscribeToHealthRequestAnalytics((requests) => {
      const counts = requests.reduce((acc, item) => {
        const purok = item.purok || 'Unassigned'
        acc[purok] = (acc[purok] || 0) + 1
        return acc
      }, {})

      setAnalyticsData(Object.entries(counts).map(([name, value]) => ({ name, value })))
    })

    return () => {
      unsubscribePending()
      unsubscribeProcessed()
      unsubscribeAnalytics()
    }
  }, [user?.role, navigate])

  const preferredRequestedSlot = useMemo(() => {
    if (!selectedRequest?.preferredAppointmentDate) return ''
    const date = selectedRequest.preferredAppointmentDate
    const time = selectedRequest.preferredAppointmentTime || ''
    return `${date}${time ? ` ${time}` : ''}`
  }, [selectedRequest])

  const requestedSlotTaken = useMemo(() => {
    if (!selectedRequest?.preferredAppointmentDate) return false
    return processedRequests.some((request) => {
      if (request.status !== 'scheduled') return false
      const requestedFull = preferredRequestedSlot
      if (!requestedFull) return false
      return request.scheduledAt === requestedFull
    })
  }, [processedRequests, preferredRequestedSlot, selectedRequest])

  useEffect(() => {
    if (!selectedRequest) return

    setReviewMessage('')
    setScheduleError('')

    const generateSummary = async () => {
      try {
        const promptParts = [
          `Resident: ${selectedRequest.residentName || 'Resident'}`,
          `Purok: ${selectedRequest.purok || 'Unassigned'}`,
          `Symptoms: ${selectedRequest.symptoms || 'Resident requested a health checkup.'}`,
          selectedRequest.preferredAppointmentDate
            ? `Preferred appointment: ${selectedRequest.preferredAppointmentDate}${selectedRequest.preferredAppointmentTime ? ` at ${selectedRequest.preferredAppointmentTime}` : ''}`
            : 'Preferred appointment: not provided',
          selectedRequest.healthAssessment?.vitalsSummary
            ? `Assessment summary: ${selectedRequest.healthAssessment.vitalsSummary}`
            : '',
          selectedRequest.healthAssessment?.recommendations?.length
            ? `Recommendations: ${selectedRequest.healthAssessment.recommendations.join(' | ')}`
            : '',
        ].filter(Boolean)

        const result = await sendHealthMessage([
          { role: 'user', content: promptParts.join('\n') },
        ], {
          name: selectedRequest.residentName || 'Resident',
          purok: selectedRequest.purok || 'barangay',
        })

        const summary = result.text?.slice(0, 320) || 'Triage summary will appear here.'
        setTriageSummary(summary)
      } catch (err) {
        setTriageSummary('Unable to generate a triage summary right now. Please review manually.')
      }
    }

    generateSummary()
  }, [selectedRequest])

  const filteredHistory = useMemo(() => {
    const searchTerm = search.toLowerCase()
    return processedRequests.filter((request) => {
      const residentName = (request.residentName || '').toLowerCase()
      const status = (request.status || '').toLowerCase()
      const purok = (request.purok || '').toLowerCase()
      return residentName.includes(searchTerm) || status.includes(searchTerm) || purok.includes(searchTerm)
    })
  }, [processedRequests, search])

  const handleReviewDecision = async (event, decision = 'approve') => {
    event.preventDefault()
    if (!selectedRequest) return

    const requestedSlot = preferredRequestedSlot

    if (decision === 'approve' && !requestedSlot) {
      setScheduleError('This resident did not provide a preferred date and time, so this request cannot be auto-scheduled.')
      return
    }

    if (decision === 'approve' && requestedSlotTaken) {
      setScheduleError('The resident requested a slot that is already scheduled. Please reject and ask them to resubmit with a new date.')
      return
    }

    const finalMessage = decision === 'approve'
      ? `Appointment approved for ${requestedSlot}.`
      : (reviewMessage.trim() || 'The requested date is not available. Please choose another day or one of the available dates.')

    setSubmitting(true)
    try {
      await updateHealthRequestStatus(selectedRequest.id, {
        status: decision === 'approve' ? 'scheduled' : 'rejected',
        scheduledAt: decision === 'approve' ? requestedSlot : null,
        updatedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.fullName || 'BHW',
        reviewMessage: finalMessage,
        reviewDecision: decision,
        triageSummary: triageSummary || selectedRequest.groqSummary || '',
        requestedAppointmentDate: selectedRequest.preferredAppointmentDate || null,
        requestedAppointmentTime: selectedRequest.preferredAppointmentTime || null,
      })
      setSelectedRequest(null)
      setReviewMessage('')
      setTriageSummary('')
      setScheduleError('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Stethoscope className="h-4 w-4" />
                BHW Workspace
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">Community Health Operations</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Review requests, triage residents, and schedule follow-up visits from a secure, role-specific dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <p className="font-semibold">Signed in as</p>
              <p>{user?.fullName || 'Barangay Health Worker'}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Real-Time Checkup Triage Tracker</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending review requests from residents</p>
              </div>
              <div className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {pendingRequests.length} pending
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 py-10 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading requests...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No requests awaiting triage.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-emerald-600" />
                          <p className="font-semibold">{request.residentName || 'Resident'}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {request.purok || 'Unassigned'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4" />
                            {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : 'Recently submitted'}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {request.symptoms || 'Resident requested a health consultation.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                      >
                        Review & schedule
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold">AI Triage Summary</h2>
            </div>
            {selectedRequest ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-sm font-semibold">Selected resident</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedRequest.residentName || 'Resident'}</p>
                  <p className="mt-1 text-sm text-slate-500">{selectedRequest.purok || 'Unassigned'}</p>
                  {selectedRequest.preferredAppointmentDate && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Preferred appointment requested: {selectedRequest.preferredAppointmentDate}{selectedRequest.preferredAppointmentTime ? ` at ${selectedRequest.preferredAppointmentTime}` : ''}
                    </p>
                  )}
                  {selectedRequest.preferredAppointmentDate && (
                    <p className={`mt-2 text-sm font-medium ${requestedSlotTaken ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      {requestedSlotTaken
                        ? 'Requested slot is already taken. Please choose a different date or time.'
                        : 'Requested slot appears available. You can approve it directly.'}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-sm font-semibold">Suggested summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{triageSummary || 'Generating professional summary...'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <label className="mb-1 block text-sm font-medium">Reply to resident</label>
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    rows={3}
                    placeholder="If the requested date is not available, mention the alternate dates or available slots."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <form onSubmit={(event) => handleReviewDecision(event, 'approve')} className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="mb-1 text-sm font-medium">Resident's requested date &amp; time</p>
                    {preferredRequestedSlot ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                        {selectedRequest.preferredAppointmentDate}
                        {selectedRequest.preferredAppointmentTime && (
                          <>
                            <Clock3 className="h-4 w-4 text-blue-500" />
                            {selectedRequest.preferredAppointmentTime}
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-rose-600 dark:text-rose-400">
                        No preferred date/time was submitted with this request.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={submitting || !preferredRequestedSlot}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Confirm Schedule
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={(event) => handleReviewDecision(event, 'reject')}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Clock3 className="h-4 w-4" />
                      Reject & suggest another date
                    </button>
                  </div>
                  {scheduleError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                      {scheduleError}
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Select a pending request to view the AI-generated summary and schedule a visit.
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Patient History Logs</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Previously processed requests and outcomes</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-24 bg-transparent outline-none sm:w-40"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400">
                    <th className="pb-3 font-medium">Resident</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Purok</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-500 dark:text-slate-400">
                        No history yet.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((request) => (
                      <tr key={request.id} className="border-t border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                        <td className="py-3 pr-3 font-medium">{request.residentName || 'Resident'}</td>
                        <td className="py-3 pr-3">{request.scheduledAt || request.updatedAt ? new Date(request.scheduledAt || request.updatedAt).toLocaleDateString() : 'â€”'}</td>
                        <td className="py-3 pr-3">{request.purok || 'Unassigned'}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {request.status || 'processed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Requests by Purok</h2>
            </div>
            {analyticsData.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Analytics will appear here once health requests are available.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {analyticsData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={index % 2 === 0 ? '#0f766e' : '#2563eb'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default BHWDashboard

